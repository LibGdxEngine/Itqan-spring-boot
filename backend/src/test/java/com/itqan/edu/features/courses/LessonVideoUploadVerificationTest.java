package com.itqan.edu.features.courses;

import com.itqan.edu.common.config.StorageProperties;
import com.itqan.edu.common.config.VideoStorageProperties;
import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.auth.User;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartCompleteRequest;
import com.itqan.edu.features.courses.dto.LessonVideoMultipartInitiateRequest;
import com.itqan.edu.features.courses.mapper.LessonMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CompleteMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadResponse;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedUploadPartRequest;

import java.net.URI;
import java.util.HexFormat;
import java.util.function.Consumer;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Completed uploads are checked for real video or audio content before the lesson goes live. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LessonVideoUploadVerificationTest {

    @Mock private LessonRepository lessonRepository;
    @Mock private LessonMapper lessonMapper;
    @Mock private S3Client s3Client;
    @Mock private StorageProperties storageProperties;
    @Mock private CourseAccessService courseAccessService;
    @Mock private S3Presigner s3Presigner;
    @Spy private VideoStorageProperties videoStorageProperties = new VideoStorageProperties();
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

    @Test
    @DisplayName("A real MP3 header marks the lesson ready, so audio lessons play in the same player")
    void acceptsMp3() {
        byte[] mp3 = {'I', 'D', '3', 4, 0, 0, 0, 0, 0, 0x21, 0, 0};
        lesson.setVideoMimeType("audio/mpeg");
        when(s3Client.getObjectAsBytes(any(GetObjectRequest.class)))
                .thenReturn(ResponseBytes.fromByteArray(GetObjectResponse.builder().build(), mp3));

        lessonVideoService.completeMultipartUpload(7L, request, new User());

        assertThat(lesson.getVideoStatus()).isEqualTo(LessonVideoStatus.READY);
        verify(s3Client, never()).deleteObject(any(DeleteObjectRequest.class));
    }

    @ParameterizedTest(name = "audio header {0} is accepted")
    @ValueSource(strings = {
            "494433040000000000000000", // MP3 with ID3 tag
            "fffb90640000000000000000", // MP3 frame sync, no tag
            "fff150800000000000000000", // AAC (ADTS)
            "524946462460000057415645", // WAV
            "4f6767530002000000000000", // OGG / Opus
            "664c61430000002200000000", // FLAC
            "2321414d520a000000000000", // AMR
            "00000020667479704d344120", // M4A (ftyp M4A)
    })
    void acceptsAudioHeaders(String hex) {
        byte[] header = HexFormat.of().parseHex(hex);
        assertThatCode(() -> lessonVideoService.validateVideoContent(header, "audio/whatever"))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("A PDF renamed to .mp3 is still rejected")
    void rejectsPdfPosingAsAudio() {
        byte[] pdf = "%PDF-1.7\n1 0 obj".getBytes(StandardCharsets.ISO_8859_1);
        assertThatThrownBy(() -> lessonVideoService.validateVideoContent(pdf, "audio/mpeg"))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.VIDEO_INVALID_MIME_TYPE);
    }

    @ParameterizedTest(name = "upload of {0} as {1} can start")
    @CsvSource({
            "lesson.mp3, audio/mpeg",
            "lesson.m4a, audio/x-m4a",
            "lesson.opus, application/octet-stream",
            "lesson.mp4, video/mp4",
    })
    @SuppressWarnings("unchecked")
    void initiateAcceptsAudioAndVideo(String filename, String mimeType) throws Exception {
        when(s3Client.createMultipartUpload(any(CreateMultipartUploadRequest.class)))
                .thenReturn(CreateMultipartUploadResponse.builder().uploadId("u-1").build());
        PresignedUploadPartRequest presigned = mock(PresignedUploadPartRequest.class);
        when(presigned.url()).thenReturn(URI.create("https://storage.test/part-1").toURL());
        when(s3Presigner.presignUploadPart(any(Consumer.class))).thenReturn(presigned);

        LessonVideoMultipartInitiateRequest init = new LessonVideoMultipartInitiateRequest();
        init.setFilename(filename);
        init.setMimeType(mimeType);
        init.setFileSizeBytes(1_000L);

        assertThat(lessonVideoService.initiateMultipartUpload(7L, init, new User()).getPartCount()).isEqualTo(1);
        assertThat(lesson.getVideoStatus()).isEqualTo(LessonVideoStatus.UPLOADING);
    }

    @ParameterizedTest(name = "upload of {0} as {1} is refused")
    @CsvSource({
            "notes.pdf, application/pdf",
            "notes.pdf, application/octet-stream",
            "page.html, text/html",
    })
    void initiateRejectsNonMedia(String filename, String mimeType) {
        LessonVideoMultipartInitiateRequest init = new LessonVideoMultipartInitiateRequest();
        init.setFilename(filename);
        init.setMimeType(mimeType);
        init.setFileSizeBytes(1_000L);

        assertThatThrownBy(() -> lessonVideoService.initiateMultipartUpload(7L, init, new User()))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.VIDEO_INVALID_MIME_TYPE);
        verify(s3Client, never()).createMultipartUpload(any(CreateMultipartUploadRequest.class));
    }
}
