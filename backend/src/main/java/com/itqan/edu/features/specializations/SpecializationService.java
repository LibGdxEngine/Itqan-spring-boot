package com.itqan.edu.features.specializations;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.specializations.dto.SpecializationRequest;
import com.itqan.edu.features.specializations.dto.SpecializationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SpecializationService {

    private final SpecializationRepository specializationRepository;

    public List<SpecializationResponse> getActive() {
        return specializationRepository.findByActiveTrueOrderByDisplayOrderAscIdAsc()
                .stream().map(this::toResponse).toList();
    }

    public List<SpecializationResponse> getAll() {
        return specializationRepository.findAllByOrderByDisplayOrderAscIdAsc()
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    @CacheEvict(value = "landing-page", allEntries = true)
    public SpecializationResponse create(SpecializationRequest request) {
        String slug = normalizeSlug(request.getSlug());
        if (specializationRepository.existsBySlug(slug)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Slug already exists");
        }
        Specialization s = Specialization.builder()
                .nameAr(request.getNameAr().trim())
                .nameEn(request.getNameEn().trim())
                .slug(slug)
                .icon(request.getIcon())
                .displayOrder(request.getDisplayOrder() == null ? 0 : request.getDisplayOrder())
                .active(request.getActive() == null ? Boolean.TRUE : request.getActive())
                .build();
        return toResponse(specializationRepository.save(s));
    }

    @Transactional
    @CacheEvict(value = "landing-page", allEntries = true)
    public SpecializationResponse update(Long id, SpecializationRequest request) {
        Specialization s = specializationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.VALIDATION_ERROR, "Specialization not found"));

        String slug = normalizeSlug(request.getSlug());
        if (!s.getSlug().equals(slug) && specializationRepository.existsBySlug(slug)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Slug already exists");
        }

        s.setNameAr(request.getNameAr().trim());
        s.setNameEn(request.getNameEn().trim());
        s.setSlug(slug);
        s.setIcon(request.getIcon());
        if (request.getDisplayOrder() != null) s.setDisplayOrder(request.getDisplayOrder());
        if (request.getActive() != null) s.setActive(request.getActive());
        return toResponse(specializationRepository.save(s));
    }

    @Transactional
    @CacheEvict(value = "landing-page", allEntries = true)
    public void delete(Long id) {
        if (!specializationRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Specialization not found");
        }
        specializationRepository.deleteById(id);
    }

    private String normalizeSlug(String slug) {
        return slug.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9-]+", "-").replaceAll("^-|-$", "");
    }

    SpecializationResponse toResponse(Specialization s) {
        return SpecializationResponse.builder()
                .id(s.getId())
                .nameAr(s.getNameAr())
                .nameEn(s.getNameEn())
                .slug(s.getSlug())
                .icon(s.getIcon())
                .displayOrder(s.getDisplayOrder())
                .active(s.getActive())
                .build();
    }
}
