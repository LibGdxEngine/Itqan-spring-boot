package com.itqan.edu.features.courses;

import com.itqan.edu.common.config.StorageProperties;
import com.itqan.edu.common.config.VideoStorageProperties;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.courses.dto.LessonResponse;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartAbortRequest;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartCompleteRequest;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartInitiateRequest;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartInitiateResponse;
import com.itqan.edu.features.courses.dto.LessonVideoPlaybackResponse;
import com.itqan.edu.features.courses.mapper.LessonMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.AbortMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CompleteMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CompletedMultipartUpload;
import software.amazon.awssdk.services.s3.model.CompletedPart;
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadResponse;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.UploadPartRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedUploadPartRequest;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class LessonVideoService {

    private static final long MIN_MULTIPART_PART_SIZE_BYTES = 5L * 1024 * 1024;
    private static final int MAX_MULTIPART_PARTS = 10_000;

    private final LessonRepository lessonRepository;
    private final LessonMapper lessonMapper;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final StorageProperties storageProperties;
    private final VideoStorageProperties videoStorageProperties;

    @Transactional
    public LessonVideoMultipartInitiateResponse initiateMultipartUpload(
            Long lessonId,
            LessonVideoMultipartInitiateRequest request) {

        Lesson lesson = getLessonOrThrow(lessonId);
        if (lesson.getType() != LessonType.VIDEO) {
            throw new BusinessException(ErrorCode.VIDEO_UPLOAD_FAILED, "Lesson is not a video lesson");
        }
        validateUploadRequest(request);

        long partSize = Math.max(videoStorageProperties.getMultipartPartSizeBytes(), MIN_MULTIPART_PART_SIZE_BYTES);
        int partCount = (int) ((request.getFileSizeBytes() + partSize - 1) / partSize);
        if (partCount > MAX_MULTIPART_PARTS) {
            throw new BusinessException(ErrorCode.VIDEO_FILE_TOO_LARGE, Map.of(
                    "maxParts", MAX_MULTIPART_PARTS,
                    "requiredParts", partCount));
        }

        String objectKey = buildObjectKey(lessonId, request.getFilename());

        CreateMultipartUploadResponse createResponse;
        try {
            createResponse = s3Client.createMultipartUpload(
                    CreateMultipartUploadRequest.builder()
                            .bucket(storageProperties.getBucket())
                            .key(objectKey)
                            .contentType(request.getMimeType())
                            .build());
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.VIDEO_UPLOAD_FAILED, ex.getMessage());
        }

        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(videoStorageProperties.getPresignExpiryMinutes());
        Duration signatureDuration = Duration.ofMinutes(videoStorageProperties.getPresignExpiryMinutes());

        List<LessonVideoMultipartInitiateResponse.PartUploadUrl> partUrls = IntStream.rangeClosed(1, partCount)
                .mapToObj(partNumber -> {
                    PresignedUploadPartRequest presigned = s3Presigner.presignUploadPart(builder -> builder
                            .signatureDuration(signatureDuration)
                            .uploadPartRequest(UploadPartRequest.builder()
                                    .bucket(storageProperties.getBucket())
                                    .key(objectKey)
                                    .uploadId(createResponse.uploadId())
                                    .partNumber(partNumber)
                                    .build()));

                    return LessonVideoMultipartInitiateResponse.PartUploadUrl.builder()
                            .partNumber(partNumber)
                            .url(presigned.url().toString())
                            .build();
                })
                .toList();

        lesson.setVideoStatus(LessonVideoStatus.UPLOADING);
        lesson.setVideoObjectKey(objectKey);
        lesson.setVideoMimeType(request.getMimeType());
        lesson.setVideoSizeBytes(request.getFileSizeBytes());
        lesson.setVideoUploadedAt(null);
        lessonRepository.save(lesson);

        return LessonVideoMultipartInitiateResponse.builder()
                .uploadId(createResponse.uploadId())
                .objectKey(objectKey)
                .fileSizeBytes(request.getFileSizeBytes())
                .partSizeBytes(partSize)
                .partCount(partCount)
                .expiresAt(expiresAt)
                .partUrls(partUrls)
                .build();
    }

    @Transactional
    public LessonResponse completeMultipartUpload(Long lessonId, LessonVideoMultipartCompleteRequest request) {
        Lesson lesson = getLessonOrThrow(lessonId);
        if (!request.getObjectKey().equals(lesson.getVideoObjectKey())) {
            throw new BusinessException(ErrorCode.VIDEO_UPLOAD_FAILED, "Upload object key mismatch");
        }

        List<CompletedPart> completedParts = request.getParts().stream()
                .filter(part -> part.getPartNumber() != null && StringUtils.hasText(part.getEtag()))
                .sorted(Comparator.comparingInt(LessonVideoMultipartCompleteRequest.UploadedPart::getPartNumber))
                .map(part -> CompletedPart.builder()
                        .partNumber(part.getPartNumber())
                        .eTag(cleanEtag(part.getEtag()))
                        .build())
                .toList();

        if (completedParts.isEmpty()) {
            throw new BusinessException(ErrorCode.VIDEO_UPLOAD_FAILED, "Missing completed parts");
        }

        try {
            s3Client.completeMultipartUpload(
                    CompleteMultipartUploadRequest.builder()
                            .bucket(storageProperties.getBucket())
                            .key(request.getObjectKey())
                            .uploadId(request.getUploadId())
                            .multipartUpload(CompletedMultipartUpload.builder()
                                    .parts(completedParts)
                                    .build())
                            .build());
        } catch (Exception ex) {
            lesson.setVideoStatus(LessonVideoStatus.FAILED);
            lessonRepository.save(lesson);
            throw new BusinessException(ErrorCode.VIDEO_UPLOAD_FAILED, ex.getMessage());
        }

        lesson.setVideoObjectKey(request.getObjectKey());
        lesson.setVideoStatus(LessonVideoStatus.READY);
        lesson.setVideoUploadedAt(LocalDateTime.now());
        lesson.setVideoUrl(null);
        lessonRepository.save(lesson);

        return lessonMapper.toResponse(lesson);
    }

    @Transactional
    public void abortMultipartUpload(Long lessonId, LessonVideoMultipartAbortRequest request) {
        Lesson lesson = getLessonOrThrow(lessonId);
        if (!request.getObjectKey().equals(lesson.getVideoObjectKey())) {
            throw new BusinessException(ErrorCode.VIDEO_UPLOAD_FAILED, "Upload object key mismatch");
        }

        try {
            s3Client.abortMultipartUpload(AbortMultipartUploadRequest.builder()
                    .bucket(storageProperties.getBucket())
                    .key(request.getObjectKey())
                    .uploadId(request.getUploadId())
                    .build());
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.VIDEO_UPLOAD_FAILED, ex.getMessage());
        }

        lesson.setVideoStatus(LessonVideoStatus.FAILED);
        lessonRepository.save(lesson);
    }

    public LessonVideoPlaybackResponse getPlaybackUrl(Long lessonId) {
        Lesson lesson = getLessonOrThrow(lessonId);

        if (!StringUtils.hasText(lesson.getVideoObjectKey())) {
            if (StringUtils.hasText(lesson.getVideoUrl())) {
                return LessonVideoPlaybackResponse.builder()
                        .url(lesson.getVideoUrl())
                        .expiresAt(null)
                        .build();
            }
            throw new BusinessException(ErrorCode.VIDEO_NOT_READY);
        }

        if (lesson.getVideoStatus() != LessonVideoStatus.READY) {
            throw new BusinessException(ErrorCode.VIDEO_NOT_READY);
        }

        Duration signatureDuration = Duration.ofMinutes(videoStorageProperties.getPlaybackUrlExpiryMinutes());
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(videoStorageProperties.getPlaybackUrlExpiryMinutes());

        PresignedGetObjectRequest presignedGetObjectRequest = s3Presigner.presignGetObject(builder -> builder
                .signatureDuration(signatureDuration)
                .getObjectRequest(GetObjectRequest.builder()
                        .bucket(storageProperties.getBucket())
                        .key(lesson.getVideoObjectKey())
                        .build()));

        return LessonVideoPlaybackResponse.builder()
                .url(presignedGetObjectRequest.url().toString())
                .expiresAt(expiresAt)
                .build();
    }

    private void validateUploadRequest(LessonVideoMultipartInitiateRequest request) {
        if (request.getFileSizeBytes() > videoStorageProperties.getMaxSizeBytes()) {
            throw new BusinessException(ErrorCode.VIDEO_FILE_TOO_LARGE, Map.of(
                    "maxSizeBytes", videoStorageProperties.getMaxSizeBytes(),
                    "requestedSizeBytes", request.getFileSizeBytes()));
        }

        String mimeType = request.getMimeType().toLowerCase(Locale.ROOT);
        if (!mimeType.startsWith("video/")) {
            throw new BusinessException(ErrorCode.VIDEO_INVALID_MIME_TYPE);
        }
    }

    private Lesson getLessonOrThrow(Long lessonId) {
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.LESSON_NOT_FOUND));
    }

    private String buildObjectKey(Long lessonId, String filename) {
        String cleanedFilename = filename.replace("\\", "/");
        String name = cleanedFilename.contains("/")
                ? cleanedFilename.substring(cleanedFilename.lastIndexOf('/') + 1)
                : cleanedFilename;
        String extension = "";
        int extensionIndex = name.lastIndexOf('.');
        if (extensionIndex > 0) {
            extension = name.substring(extensionIndex).toLowerCase(Locale.ROOT);
            name = name.substring(0, extensionIndex);
        }

        String sanitizedBase = name.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        if (!StringUtils.hasText(sanitizedBase)) {
            sanitizedBase = "video";
        }

        return "lessons/" + lessonId + "/" + UUID.randomUUID() + "-" + sanitizedBase + extension;
    }

    private String cleanEtag(String eTag) {
        String trimmed = eTag.trim();
        if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length() > 1) {
            return trimmed.substring(1, trimmed.length() - 1);
        }
        return trimmed;
    }
}
