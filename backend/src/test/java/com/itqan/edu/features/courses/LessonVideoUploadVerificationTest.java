package com.itqan.edu.features.courses;

import com.itqan.edu.common.config.StorageProperties;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartCompleteRequest;
import com.itqan.edu.features.courses.mapper.LessonMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CompleteMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Completed uploads are checked for real video content before the lesson goes live. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LessonVideoUploadVerificationTest {

    @Mock private LessonRepository lessonRepository;
    @Mock private LessonMapper lessonMapper;
    @Mock private S3Client s3Client;
    @Mock private StorageProperties storageProperties;
    @Mock private CourseAccessService courseAccessService;
    @InjectMocks private LessonVideoService lessonVideoService;

    private Lesson lesson;
    private LessonVideoMultipartCompleteRequest request;

    @BeforeEach
    void setUp() {
        lesson = Lesson.builder().id(7L).title("Intro").type(LessonType.VIDEO)
                .videoObjectKey("lessons/7/video.mp4").videoMimeType("video/mp4")
                .videoStatus(LessonVideoStatus.UPLOADING).orderIndex(1)
                .module(Module.builder().course(Course.builder().id(1L).build()).build())
                .build();
        when(lessonRepository.findById(7L)).thenReturn(Optional.of(lesson));
        when(storageProperties.getBucket()).thenReturn("videos");

        request = new LessonVideoMultipartCompleteRequest();
        request.setUploadId("upload-1");
        request.setObjectKey("lessons/7/video.mp4");
        LessonVideoMultipartCompleteRequest.UploadedPart part = new LessonVideoMultipartCompleteRequest.UploadedPart();
        part.setPartNumber(1);
        part.setEtag("\"etag\"");
        request.setParts(List.of(part));
    }

    @Test
    @DisplayName("A real MP4 header marks the lesson video ready")
    void acceptsMp4() {
        byte[] mp4 = {0, 0, 0, 0x20, 'f', 't', 'y', 'p', 'i', 's', 'o', 'm'};
        when(s3Client.getObjectAsBytes(any(GetObjectRequest.class)))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), mp4));

        lessonVideoService.completeMultipartUpload(7L, request, new User());

        assertThat(lesson.getVideoStatus()).isEqualTo(LessonVideoStatus.READY);
        verify(s3Client).completeMultipartUpload(any(CompleteMultipartUploadRequest.class));
        verify(s3Client, never()).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    @DisplayName("A non-video file is deleted and the lesson upload fails")
    void rejectsNonVideo() {
        byte[] html = "<html><body>".getBytes(StandardCharsets.US_ASCII);
        when(s3Client.getObjectAsBytes(any(GetObjectRequest.class)))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), html));

        assertThatThrownBy(() -> lessonVideoService.completeMultipartUpload(7L, request, new User()))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.VIDEO_INVALID_MIME_TYPE);

        assertThat(lesson.getVideoStatus()).isEqualTo(LessonVideoStatus.FAILED);
        assertThat(lesson.getVideoObjectKey()).isNull();
        verify(s3Client).deleteObject(any(DeleteObjectRequest.class));
    }
}
