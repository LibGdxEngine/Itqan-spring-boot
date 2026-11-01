package com.itqan.edu.features.scholarships;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.common.service.EmailService;
import com.itqan.edu.features.audit.AuditLogService;
import com.itqan.edu.features.payments.paymob.PaymobCheckout;
import com.itqan.edu.features.payments.paymob.PaymobGateway;
import com.itqan.edu.features.payments.paymob.PaymobIntentionRequest;
import com.itqan.edu.features.payments.paymob.PaymobOutcome;
import com.itqan.edu.features.payments.paymob.PaymobProperties;
import com.itqan.edu.features.payments.paymob.PaymobWebhookService;
import com.itqan.edu.features.scholarships.dto.AdminDonationRow;
import com.itqan.edu.features.scholarships.dto.DonationCheckoutRequest;
import com.itqan.edu.features.scholarships.dto.DonationCheckoutResponse;
import com.itqan.edu.features.scholarships.dto.DonationStatusResponse;
import com.itqan.edu.features.scholarships.dto.ManualDonationRequest;
import com.itqan.edu.features.scholarships.dto.ScholarshipFundSummary;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/** Donations to the general scholarship fund (Paymob online, or recorded by an admin), and the fund balance. */
@Service
@RequiredArgsConstructor
@Slf4j
public class DonationService {

    static final double MIN_ONLINE_AMOUNT = 10.0;
    static final double MAX_ONLINE_AMOUNT = 500_000.0;

    private final DonationRepository donationRepository;
    private final ScholarshipApplicationRepository applicationRepository;
    private final PaymobGateway paymobGateway;
    private final PaymobProperties paymobProperties;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    /** Starts an online donation through Paymob. Open to guests: no account is needed. */
    @Transactional
    public DonationCheckoutResponse createCheckout(DonationCheckoutRequest request) {
        if (!paymobProperties.isConfigured()) {
            throw new BusinessException(ErrorCode.ONLINE_PAYMENT_DISABLED);
        }
        double amount = request.getAmount() == null ? 0 : request.getAmount();
        if (amount < MIN_ONLINE_AMOUNT || amount > MAX_ONLINE_AMOUNT) {
            throw new BusinessException(ErrorCode.DONATION_AMOUNT_INVALID);
        }
        amount = Math.round(amount * 100) / 100.0;
        String currency = paymobProperties.getCurrency().toUpperCase(Locale.ROOT);

        Donation donation = donationRepository.save(Donation.builder()
                .donorEmail(request.getDonorEmail().trim().toLowerCase(Locale.ROOT))
                .donorName(trimToNull(request.getDonorName()))
                .message(trimToNull(request.getMessage()))
                .amount(amount)
                .currency(currency)
                .status(DonationStatus.PENDING)
                .gateway(Donation.GATEWAY_PAYMOB)
                .method("ONLINE")
                .build());

        String reference = PaymobWebhookService.DONATION_PREFIX + donation.getId() + "-"
                + UUID.randomUUID().toString().substring(0, 8);
        donation.setGatewayReference(reference);
        donationRepository.save(donation);

        String origin = paymobProperties.publicOrigin();
        String[] names = splitName(donation.getDonorName());
        PaymobCheckout checkout = paymobGateway.createIntention(PaymobIntentionRequest.builder()
                .amountCents(Math.round(amount * 100))
                .currency(currency)
                .itemName("Scholarship fund donation")
                .reference(reference)
                .firstName(names[0])
                .lastName(names[1])
                .email(donation.getDonorEmail())
                .redirectionUrl(origin + "/scholarships/donate/thank-you?session_id=" + reference)
                .notificationUrl(origin + "/api/payments/webhook/paymob")
                .build());

        return new DonationCheckoutResponse(donation.getId(), reference, checkout.checkoutUrl());
    }

    /** Public status lookup for the thank-you page. Reveals nothing about the donor. */
    @Transactional(readOnly = true)
    public DonationStatusResponse getStatus(String reference) {
        Donation donation = donationRepository.findByGatewayReference(reference)
                .orElseThrow(() -> new BusinessException(ErrorCode.DONATION_NOT_FOUND));
        return new DonationStatusResponse(donation.getStatus(), donation.getAmount(), donation.getCurrency());
    }

    /** Applies a verified Paymob callback to the donation it refers to. */
    @Transactional
    public void applyPaymobTransaction(String reference, String transactionId, PaymobOutcome outcome) {
        Donation donation = donationRepository.findByGatewayReference(reference).orElse(null);
        if (donation == null) {
            log.warn("Paymob callback for unknown donation reference {}", reference);
            return;
        }
        switch (outcome) {
            case PAID -> {
                if (donation.getStatus() != DonationStatus.PENDING && donation.getStatus() != DonationStatus.FAILED) {
                    return;
                }
                donation.setStatus(DonationStatus.COMPLETED);
                donation.setCompletedAt(LocalDateTime.now());
                donation.setGatewayTransactionId(transactionId);
                donation.setReference(transactionId);
                donationRepository.save(donation);
                auditLogService.recordSuccess("DONATION_COMPLETED", "DONATION", String.valueOf(donation.getId()),
                        Map.of("amount", donation.getAmount(), "currency", donation.getCurrency(), "gateway", donation.getGateway()));
                emailService.sendDonationReceipt(donation.getDonorEmail(), donation.getDonorName(),
                        formatAmount(donation.getAmount(), donation.getCurrency()));
            }
            case FAILED -> {
                if (donation.getStatus() == DonationStatus.PENDING) {
                    donation.setStatus(DonationStatus.FAILED);
                    donationRepository.save(donation);
                }
            }
            case REFUNDED -> {
                if (donation.getStatus() != DonationStatus.REFUNDED) {
                    donation.setStatus(DonationStatus.REFUNDED);
                    donationRepository.save(donation);
                    auditLogService.recordSuccess("DONATION_REFUNDED", "DONATION", String.valueOf(donation.getId()),
                            Map.of("source", "paymob-callback"));
                }
            }
            default -> {
            }
        }
    }

    /** Records money received outside the site (Vodafone Cash, InstaPay, cash, bank transfer). */
    @Transactional
    public AdminDonationRow recordManual(ManualDonationRequest request, Long adminUserId) {
        LocalDateTime now = LocalDateTime.now();
        Donation donation = donationRepository.save(Donation.builder()
                .donorEmail(StringUtils.hasText(request.getDonorEmail())
                        ? request.getDonorEmail().trim().toLowerCase(Locale.ROOT) : null)
                .donorName(trimToNull(request.getDonorName()))
                .message(trimToNull(request.getMessage()))
                .amount(request.getAmount())
                .currency(request.getCurrency().trim().toUpperCase(Locale.ROOT))
                .status(DonationStatus.COMPLETED)
                .gateway(Donation.GATEWAY_MANUAL)
                .method(request.getMethod().trim().toUpperCase(Locale.ROOT))
                .reference(trimToNull(request.getReference()))
                .recordedByUserId(adminUserId)
                .createdAt(now)
                .completedAt(now)
                .build());
        auditLogService.recordSuccess("DONATION_RECORDED", "DONATION", String.valueOf(donation.getId()),
                Map.of("amount", donation.getAmount(), "currency", donation.getCurrency(), "method", donation.getMethod()));
        emailService.sendDonationReceipt(donation.getDonorEmail(), donation.getDonorName(),
                formatAmount(donation.getAmount(), donation.getCurrency()));
        return AdminDonationRow.from(donation);
    }

    @Transactional(readOnly = true)
    public Page<AdminDonationRow> search(String query, DonationStatus status, String gateway, Pageable pageable) {
        Specification<Donation> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (StringUtils.hasText(gateway)) {
                predicates.add(cb.equal(root.get("gateway"), gateway.trim().toUpperCase(Locale.ROOT)));
            }
            if (StringUtils.hasText(query)) {
                String like = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(cb.coalesce(root.get("donorEmail"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("donorName"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("reference"), "")), like)));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return donationRepository.findAll(spec, pageable).map(AdminDonationRow::from);
    }

    @Transactional(readOnly = true)
    public ScholarshipFundSummary summary() {
        double received = nz(donationRepository.sumCompleted());
        double used = nz(applicationRepository.sumFundUsed());
        return new ScholarshipFundSummary(received, used, received - used,
                donationRepository.countCompleted(),
                applicationRepository.countByStatus(ScholarshipStatus.PENDING),
                applicationRepository.countByStatus(ScholarshipStatus.APPROVED));
    }

    /** Money in the fund that has not been given to an approved scholarship yet. */
    @Transactional(readOnly = true)
    public double balance() {
        return nz(donationRepository.sumCompleted()) - nz(applicationRepository.sumFundUsed());
    }

    private static String[] splitName(String fullName) {
        if (!StringUtils.hasText(fullName)) {
            return new String[]{"Donor", "NA"};
        }
        String[] parts = fullName.trim().split("\\s+", 2);
        return new String[]{parts[0], parts.length > 1 ? parts[1] : "NA"};
    }

    private static double nz(Double value) {
        return value == null ? 0 : value;
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private static String formatAmount(Double amount, String currency) {
        String number = amount % 1 == 0 ? String.valueOf(amount.longValue()) : String.format(Locale.ROOT, "%.2f", amount);
        return number + " " + currency;
    }
}
