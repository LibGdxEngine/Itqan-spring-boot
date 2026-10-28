package com.itqan.edu.features.courses;

import com.itqan.edu.common.config.StorageProperties;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.courses.dto.ThumbnailUploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Stores small course files (thumbnails, lesson resources) in the bucket under an unguessable
 * key and returns their public URL.
 */
@Component
@RequiredArgsConstructor
public class PublicFileStorage {

    private final S3Client s3Client;
    private final StorageProperties storageProperties;

    public ThumbnailUploadResponse upload(MultipartFile file, String folder, Set<String> allowedTypes,
                                          long maxBytes, String label) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, label + " file is required");
        }
        if (file.getSize() > maxBytes) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    label + " file exceeds " + (maxBytes / (1024 * 1024)) + "MB");
        }
        String contentType = file.getContentType();
        String normalized = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        if (!allowedTypes.contains(normalized)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, label + " file type is not allowed");
        }

        String objectKey = folder + "/" + UUID.randomUUID() + "-" + safeName(file.getOriginalFilename());
        try {
            s3Client.putObject(PutObjectRequest.builder()
                            .bucket(storageProperties.getBucket())
                            .key(objectKey)
                            .contentType(normalized)
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException ex) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Failed to read " + label.toLowerCase(Locale.ROOT) + " upload: " + ex.getMessage());
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Failed to upload " + label.toLowerCase(Locale.ROOT) + ": " + ex.getMessage());
        }

        return ThumbnailUploadResponse.builder()
                .url(buildPublicUrl(objectKey))
                .objectKey(objectKey)
                .build();
    }

    private static String safeName(String filename) {
        String safeName = (filename == null ? "file" : filename).toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9.]+", "-")
                .replaceAll("^-|-$", "");
        return safeName.isBlank() ? "file" : safeName;
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
}
