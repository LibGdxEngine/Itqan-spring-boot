package com.itqan.edu.features.video.mapper;

import com.itqan.edu.features.video.VideoBookmark;
import com.itqan.edu.features.video.dto.VideoBookmarkRequest;
import com.itqan.edu.features.video.dto.VideoBookmarkResponse;
import org.springframework.stereotype.Component;

@Component
public class VideoBookmarkMapper {

    public VideoBookmark toEntity(VideoBookmarkRequest request, Long studentId, Long lessonId) {
        return VideoBookmark.builder()
                .studentId(studentId)
                .lessonId(lessonId)
                .timestamp(request.getTimestamp())
                .note(request.getNote())
                .build();
    }

    public VideoBookmarkResponse toResponse(VideoBookmark bookmark) {
        return VideoBookmarkResponse.builder()
                .id(bookmark.getId())
                .studentId(bookmark.getStudentId())
                .lessonId(bookmark.getLessonId())
                .timestamp(bookmark.getTimestamp())
                .note(bookmark.getNote())
                .createdAt(bookmark.getCreatedAt())
                .updatedAt(bookmark.getUpdatedAt())
                .build();
    }
}
