package com.itqan.edu.features.clips;

import com.itqan.edu.common.config.StorageProperties;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.clips.dto.ClipResponse;
import com.itqan.edu.features.clips.dto.ClipUpdateRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClipService {

    private static final long MAX_CLIP_BYTES = 500L * 1024 * 1024;
    private static final int MAX_BULK_FILES = 20;

    private final ClipRepository clipRepository;
    private final S3Client s3Client;
    private final StorageProperties storageProperties;

    public List<ClipResponse> bulkUpload(List<MultipartFile> files) {
        if (files.size() > MAX_BULK_FILES) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Maximum " + MAX_BULK_FILES + " files allowed per upload");
        }

        List<Clip> savedClips = new ArrayList<>();
        List<String> uploadedKeys = new ArrayList<>();

        try {
            for (MultipartFile file : files) {
                String contentType = file.getContentType();
                if (contentType == null || (!contentType.startsWith("video/") && !contentType.startsWith("audio/"))) {
                    throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                            "File '" + file.getOriginalFilename() + "' must be a video or audio file");
                }
                if (file.getSize() > MAX_CLIP_BYTES) {
                    throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                            "File '" + file.getOriginalFilename() + "' exceeds the 500MB size limit");
                }

                ClipType type = contentType.startsWith("video/") ? ClipType.VIDEO : ClipType.AUDIO;
                String title = deriveTitle(file.getOriginalFilename());
                String objectKey = buildObjectKey(file.getOriginalFilename());

                try {
                    s3Client.putObject(
                            PutObjectRequest.builder()
                                    .bucket(storageProperties.getBucket())
                                    .key(objectKey)
                                    .contentType(contentType.toLowerCase(Locale.ROOT))
                                    .build(),
                            RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
                } catch (IOException ex) {
                    throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                            "Failed to read file '" + file.getOriginalFilename() + "': " + ex.getMessage());
                } catch (Exception ex) {
                    throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                            "Failed to upload '" + file.getOriginalFilename() + "': " + ex.getMessage());
                }

                uploadedKeys.add(objectKey);

                Clip clip = Clip.builder()
                        .title(title)
                        .type(type)
                        .fileUrl(buildPublicUrl(objectKey))
                        .objectKey(objectKey)
                        .mimeType(contentType)
                        .sizeBytes(file.getSize())
                        .build();

                savedClips.add(clipRepository.save(clip));
                log.info("Uploaded clip '{}' type={} key={}", title, type, objectKey);
            }
        } catch (Exception ex) {
            // Roll back any S3 objects already written before the failure
            uploadedKeys.forEach(key -> {
                try {
                    s3Client.deleteObject(DeleteObjectRequest.builder()
                            .bucket(storageProperties.getBucket())
                            .key(key)
                            .build());
                    log.warn("Rolled back S3 object {} after bulk upload failure", key);
                } catch (Exception ignored) {
                }
            });
            throw ex;
        }

        return savedClips.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Page<ClipResponse> listClips(String search, String type, Pageable pageable) {
        ClipType clipType = null;
        if (type != null && !type.isBlank()) {
            try {
                clipType = ClipType.valueOf(type.toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ignored) {
            }
        }

        boolean hasSearch = search != null && !search.isBlank();
        Page<Clip> page = clipRepository.search(hasSearch ? search : "", clipType, pageable);
        return page.map(this::toResponse);
    }

    @Transactional
    public ClipResponse updateClip(Long id, ClipUpdateRequest req) {
        Clip clip = clipRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CLIP_NOT_FOUND));
        clip.setTitle(req.getTitle().trim());
        clip.setDescription(req.getDescription() != null ? req.getDescription().trim() : null);
        return toResponse(clipRepository.save(clip));
    }

    @Transactional
    public void deleteClip(Long id) {
        Clip clip = clipRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CLIP_NOT_FOUND));
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(storageProperties.getBucket())
                    .key(clip.getObjectKey())
                    .build());
        } catch (Exception ex) {
            log.warn("Failed to delete S3 object {}: {}", clip.getObjectKey(), ex.getMessage());
        }
        clipRepository.delete(clip);
        log.info("Deleted clip id={}", id);
    }

    private String deriveTitle(String filename) {
        if (filename == null || filename.isBlank()) return "مقطع";
        String name = filename.contains(".")
                ? filename.substring(0, filename.lastIndexOf('.'))
                : filename;
        name = name.replace('_', ' ').replace('-', ' ').replaceAll("\\s+", " ").trim();
        return name.isBlank() ? "مقطع" : name;
    }

    private String buildObjectKey(String filename) {
        String safe = (filename == null ? "clip" : filename).toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9._]+", "-")
                .replaceAll("^-|-$", "");
        if (safe.isBlank()) safe = "clip";
        return "clips/" + UUID.randomUUID() + "-" + safe;
    }

    private String buildPublicUrl(String objectKey) {
        String endpoint = storageProperties.getPublicEndpoint();
        if (endpoint == null) endpoint = "";
        endpoint = endpoint.replaceAll("/+$", "");
        if (storageProperties.isPathStyleAccessEnabled()) {
            return endpoint + "/" + storageProperties.getBucket() + "/" + objectKey;
        }
        return endpoint + "/" + objectKey;
    }

    private ClipResponse toResponse(Clip clip) {
        return ClipResponse.builder()
                .id(clip.getId())
                .title(clip.getTitle())
                .type(clip.getType())
                // Derive the public URL from the object key + current config on every read.
                // The stored file_url can go stale if the public endpoint changes (it did:
                // old rows kept a "/media" prefix that 404s); object_key is always correct.
                .fileUrl(buildPublicUrl(clip.getObjectKey()))
                .description(clip.getDescription())
                .mimeType(clip.getMimeType())
                .sizeBytes(clip.getSizeBytes())
                .createdAt(clip.getCreatedAt())
                .build();
    }
}
