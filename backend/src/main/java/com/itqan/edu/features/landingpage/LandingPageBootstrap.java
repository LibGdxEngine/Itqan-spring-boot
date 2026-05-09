package com.itqan.edu.features.landingpage;

import com.itqan.edu.features.specializations.Specialization;
import com.itqan.edu.features.specializations.SpecializationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class LandingPageBootstrap {

    private final LandingPageRepository landingPageRepository;
    private final SpecializationRepository specializationRepository;

    private static final List<DefaultSpec> DEFAULT_SPECIALIZATIONS = List.of(
            new DefaultSpec("tafsir", "التفسير", "Tafsir"),
            new DefaultSpec("hadith", "الحديث", "Hadith"),
            new DefaultSpec("fiqh", "الفقه", "Fiqh"),
            new DefaultSpec("aqeedah", "العقيدة", "Aqeedah"),
            new DefaultSpec("seerah", "السيرة", "Seerah"),
            new DefaultSpec("arabic", "اللغة العربية", "Arabic"),
            new DefaultSpec("tajweed", "التجويد", "Tajweed"),
            new DefaultSpec("usool", "أصول الفقه", "Usool al-Fiqh")
    );

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        if (!landingPageRepository.existsById(LandingPageConfig.SINGLETON_ID)) {
            landingPageRepository.save(LandingPageConfig.builder()
                    .id(LandingPageConfig.SINGLETON_ID)
                    .build());
            log.info("Seeded default LandingPageConfig singleton");
        }
        if (specializationRepository.count() == 0) {
            int order = 0;
            for (DefaultSpec d : DEFAULT_SPECIALIZATIONS) {
                specializationRepository.save(Specialization.builder()
                        .slug(d.slug)
                        .nameAr(d.nameAr)
                        .nameEn(d.nameEn)
                        .displayOrder(order++)
                        .active(true)
                        .build());
            }
            log.info("Seeded {} default specializations", DEFAULT_SPECIALIZATIONS.size());
        }
    }

    private record DefaultSpec(String slug, String nameAr, String nameEn) {
    }
}
