package com.itqan.edu.features.settings;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.audit.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Site-wide settings editable from the admin panel. Only keys in {@link #DEFAULTS} exist;
 * unknown keys are rejected so the table cannot be used as arbitrary storage.
 */
@Service
@RequiredArgsConstructor
public class SiteSettingService {

    private static final int MAX_VALUE_LENGTH = 2000;

    /** Allowed keys and their defaults (empty = not configured). Insertion order = display order. */
    public static final Map<String, String> DEFAULTS;

    static {
        Map<String, String> defaults = new LinkedHashMap<>();
        defaults.put("siteName", "Itqan");
        defaults.put("tagline", "");
        defaults.put("contactEmail", "");
        defaults.put("contactPhone", "");
        defaults.put("whatsappNumber", "");
        defaults.put("address", "");
        defaults.put("facebookUrl", "");
        defaults.put("instagramUrl", "");
        defaults.put("youtubeUrl", "");
        defaults.put("xUrl", "");
        defaults.put("tiktokUrl", "");
        defaults.put("telegramUrl", "");
        defaults.put("defaultCurrency", "EGP");
        defaults.put("cardPaymentsEnabled", "false");
        defaults.put("manualPaymentsEnabled", "true");
        defaults.put("maintenanceMessage", "");
        DEFAULTS = java.util.Collections.unmodifiableMap(defaults);
    }

    private final SiteSettingRepository siteSettingRepository;
    private final AuditLogService auditLogService;

    @Cacheable(value = "settings", key = "'all'")
    @Transactional(readOnly = true)
    public Map<String, String> getAll() {
        Map<String, String> result = new LinkedHashMap<>(DEFAULTS);
        siteSettingRepository.findAll().forEach(setting -> {
            if (DEFAULTS.containsKey(setting.getKey())) {
                result.put(setting.getKey(), setting.getValue() == null ? "" : setting.getValue());
            }
        });
        return result;
    }

    @CacheEvict(value = "settings", allEntries = true)
    @Transactional
    public Map<String, String> update(Map<String, String> changes) {
        for (Map.Entry<String, String> entry : changes.entrySet()) {
            if (!DEFAULTS.containsKey(entry.getKey())) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Unknown setting: " + entry.getKey());
            }
            String value = entry.getValue() == null ? "" : entry.getValue().trim();
            if (value.length() > MAX_VALUE_LENGTH) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Value too long for: " + entry.getKey());
            }
            siteSettingRepository.save(SiteSetting.builder().key(entry.getKey()).value(value).build());
        }
        auditLogService.recordSuccess("SETTINGS_UPDATED", "SETTINGS", "site",
                Map.of("keys", String.join(",", changes.keySet())));
        Map<String, String> result = new LinkedHashMap<>(DEFAULTS);
        siteSettingRepository.findAll().forEach(s -> result.put(s.getKey(), s.getValue() == null ? "" : s.getValue()));
        return result;
    }
}
