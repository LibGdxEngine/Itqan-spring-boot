package com.itqan.edu.features.courses;

import com.itqan.edu.common.config.StorageProperties;
import com.itqan.edu.common.config.VideoStorageProperties;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.dto.LessonResponse;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartAbortRequest;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartCompleteRequest;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartInitiateRequest;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartInitiateResponse;
import com.itqan.edu.features.courses.dto.LessonVideoPlaybackResponse;
import com.itqan.edu.features.courses.mapper.LessonMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
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
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
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
@Slf4j
public class LessonVideoService {

    private static final long MIN_MULTIPART_PART_SIZE_BYTES = 5L * 1024 * 1024;
    private static final int MAX_MULTIPART_PARTS = 10_000;

    private final LessonRepository lessonRepository;
    private final LessonMapper lessonMapper;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final StorageProperties storageProperties;
    private final VideoStorageProperties videoStorageProperties;
    private final CourseAccessService courseAccessService;

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public LessonVideoMultipartInitiateResponse initiateMultipartUpload(
            Long lessonId,
            LessonVideoMultipartInitiateRequest request,
            User currentUser) {

        Lesson lesson = getLessonOrThrow(lessonId);
        courseAccessService.assertCanManage(currentUser, lesson.getModule().getCourse());
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
            log.error("Multipart initiate failed lesson={} key={}: {}", lessonId, objectKey, ex.toString(), ex);
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

    @CacheEvict(value = "courses", allEntries = true)
    // Keep the FAILED status when we reject an upload instead of rolling it back.
    @Transactional(noRollbackFor = BusinessException.class)
    public LessonResponse completeMultipartUpload(Long lessonId, LessonVideoMultipartCompleteRequest request,
            User currentUser) {
        Lesson lesson = getLessonOrThrow(lessonId);
        courseAccessService.assertCanManage(currentUser, lesson.getModule().getCourse());
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
            log.error("Multipart complete failed lesson={} key={} uploadId={}: {}",
                    lessonId, request.getObjectKey(), request.getUploadId(), ex.toString(), ex);
            lesson.setVideoStatus(LessonVideoStatus.FAILED);
            lessonRepository.save(lesson);
            throw new BusinessException(ErrorCode.VIDEO_UPLOAD_FAILED, ex.getMessage());
        }

        verifyUploadedVideo(lesson, request.getObjectKey());

        lesson.setVideoObjectKey(request.getObjectKey());
        lesson.setVideoStatus(LessonVideoStatus.READY);
        lesson.setVideoUploadedAt(LocalDateTime.now());
        lesson.setVideoUrl(null);
        lessonRepository.save(lesson);

        return lessonMapper.toResponse(lesson);
    }

    @CacheEvict(value = "courses", allEntries = true)
    @Transactional
    public void abortMultipartUpload(Long lessonId, LessonVideoMultipartAbortRequest request, User currentUser) {
        Lesson lesson = getLessonOrThrow(lessonId);
        courseAccessService.assertCanManage(currentUser, lesson.getModule().getCourse());
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
            log.warn("Multipart abort failed lesson={} key={} uploadId={}: {}",
                    lessonId, request.getObjectKey(), request.getUploadId(), ex.toString(), ex);
            throw new BusinessException(ErrorCode.VIDEO_UPLOAD_FAILED, ex.getMessage());
        }

        lesson.setVideoStatus(LessonVideoStatus.FAILED);
        lessonRepository.save(lesson);
    }

    @Transactional(readOnly = true)
    public LessonVideoPlaybackResponse getPlaybackUrl(Long lessonId, User currentUser) {
        Lesson lesson = getLessonOrThrow(lessonId);
        courseAccessService.assertCanViewLesson(currentUser, lesson);

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

    /**
     * Validates the content of an uploaded video file by inspecting its magic bytes.
     *
     * <p>This method is designed to be called from the controller or a completion callback
     * once the first part bytes are available. In the current presigned-URL multipart upload
     * flow, file bytes never pass through this service directly, so this method acts as a
     * public validation hook. The controller should read the first 12 bytes of the first
     * uploaded part (e.g., via a HEAD/GET on the S3 object after upload completes, or by
     * requiring the client to send the first 12 bytes during initiation) and call this method
     * before finalising the lesson status to READY.
     *
     * <p>Supported formats: MP4/M4V/MOV (ftyp box), WebM/Matroska, AVI (RIFF), MPEG, FLV.
     *
     * @param headerBytes   the first 12 bytes of the uploaded file
     * @param declaredMimeType the MIME type the client declared (used in error messages)
     * @throws BusinessException with {@code ErrorCode.VIDEO_INVALID_MIME_TYPE} if the content
     *                           does not match any supported video format
     */
    public void validateVideoContent(byte[] headerBytes, String declaredMimeType) {
        validateVideoMagicNumber(headerBytes, declaredMimeType);
    }

    private void validateVideoMagicNumber(byte[] header, String declaredMimeType) {
        // Check first 12 bytes against known video signatures
        if (header == null || header.length < 12) {
            throw new BusinessException(ErrorCode.VIDEO_INVALID_MIME_TYPE,
                    "File too small to determine type");
        }

        boolean valid = false;

        // MP4 / M4V / MOV — bytes 4-11 should be 'ftyp' followed by brand
        if (header.length >= 12
                && header[4] == 'f' && header[5] == 't' && header[6] == 'y' && header[7] == 'p') {
            valid = true;
        }

        // WebM / Matroska — starts with 1A 45 DF A3
        if (!valid && header[0] == (byte) 0x1A && header[1] == (byte) 0x45
                && header[2] == (byte) 0xDF && header[3] == (byte) 0xA3) {
            valid = true;
        }

        // AVI — starts with 'RIFF' ... 'AVI '
        if (!valid && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                && header.length >= 12 && header[8] == 'A' && header[9] == 'V' && header[10] == 'I' && header[11] == ' ') {
            valid = true;
        }

        // MPEG — starts with 00 00 01 Bx or 00 00 01 Ex
        if (!valid && header[0] == 0x00 && header[1] == 0x00 && header[2] == 0x01
                && ((header[3] & 0xF0) == 0xB0 || (header[3] & 0xF0) == 0xE0)) {
            valid = true;
        }

        // FLV — starts with 'FLV'
        if (!valid && header[0] == 'F' && header[1] == 'L' && header[2] == 'V') {
            valid = true;
        }

        if (!valid) {
            throw new BusinessException(ErrorCode.VIDEO_INVALID_MIME_TYPE,
                    "File content does not match any supported video format. Declared: " + declaredMimeType);
        }
    }

    /**
     * Uploads go straight from the browser to storage, so the first bytes are checked here once
     * the object exists. Anything that is not a real video file is deleted and the upload fails.
     */
    private void verifyUploadedVideo(Lesson lesson, String objectKey) {
        byte[] header;
        try {
            header = s3Client.getObjectAsBytes(GetObjectRequest.builder()
                    .bucket(storageProperties.getBucket())
                    .key(objectKey)
                    .range("bytes=0-11")
                    .build()).asByteArray();
        } catch (Exception ex) {
            log.error("Could not read uploaded video header lesson={} key={}: {}", lesson.getId(), objectKey, ex.toString());
            lesson.setVideoStatus(LessonVideoStatus.FAILED);
            lessonRepository.save(lesson);
            throw new BusinessException(ErrorCode.VIDEO_UPLOAD_FAILED, "Uploaded video could not be verified");
        }
        try {
            validateVideoMagicNumber(header, lesson.getVideoMimeType());
        } catch (BusinessException ex) {
            log.warn("Rejected upload that is not a video lesson={} key={}", lesson.getId(), objectKey);
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(storageProperties.getBucket())
                        .key(objectKey)
                        .build());
            } catch (Exception deleteError) {
                log.error("Could not delete rejected upload key={}: {}", objectKey, deleteError.toString());
            }
            lesson.setVideoObjectKey(null);
            lesson.setVideoStatus(LessonVideoStatus.FAILED);
            lessonRepository.save(lesson);
            throw ex;
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
