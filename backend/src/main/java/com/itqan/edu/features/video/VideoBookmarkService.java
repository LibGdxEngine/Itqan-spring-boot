package com.itqan.edu.features.video;

import com.itqan.edu.common.exception.BusinessException;
import com.itqan.edu.common.exception.ErrorCode;
import com.itqan.edu.features.courses.LessonRepository;
import com.itqan.edu.features.video.dto.VideoBookmarkRequest;
import com.itqan.edu.features.video.dto.VideoBookmarkResponse;
import com.itqan.edu.features.video.mapper.VideoBookmarkMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VideoBookmarkService {

    private final VideoBookmarkRepository bookmarkRepository;
    private final LessonRepository lessonRepository;
    private final VideoBookmarkMapper bookmarkMapper;

    @Transactional
    public VideoBookmarkResponse createBookmark(Long studentId, Long lessonId, VideoBookmarkRequest request) {
        // Verify lesson exists
        if (!lessonRepository.existsById(lessonId)) {
            throw new BusinessException(ErrorCode.LESSON_NOT_FOUND);
        }

        // Validate timestamp
        if (request.getTimestamp() < 0) {
            throw new BusinessException(ErrorCode.INVALID_TIMESTAMP);
        }

        VideoBookmark bookmark = bookmarkMapper.toEntity(request, studentId, lessonId);
        VideoBookmark savedBookmark = bookmarkRepository.save(bookmark);

        return bookmarkMapper.toResponse(savedBookmark);
    }

    @Transactional(readOnly = true)
    public List<VideoBookmarkResponse> getBookmarksByLesson(Long studentId, Long lessonId) {
        List<VideoBookmark> bookmarks = bookmarkRepository
                .findByStudentIdAndLessonIdOrderByTimestampAsc(studentId, lessonId);

        return bookmarks.stream()
                .map(bookmarkMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VideoBookmarkResponse> getAllBookmarks(Long studentId) {
        List<VideoBookmark> bookmarks = bookmarkRepository
                .findByStudentIdOrderByCreatedAtDesc(studentId);

        return bookmarks.stream()
                .map(bookmarkMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public VideoBookmarkResponse updateBookmark(Long bookmarkId, Long studentId, VideoBookmarkRequest request) {
        VideoBookmark bookmark = bookmarkRepository.findByIdAndStudentId(bookmarkId, studentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKMARK_NOT_FOUND));

        // Validate timestamp
        if (request.getTimestamp() < 0) {
            throw new BusinessException(ErrorCode.INVALID_TIMESTAMP);
        }

        bookmark.setTimestamp(request.getTimestamp());
        bookmark.setNote(request.getNote());

        VideoBookmark updatedBookmark = bookmarkRepository.save(bookmark);
        return bookmarkMapper.toResponse(updatedBookmark);
    }

    @Transactional
    public void deleteBookmark(Long bookmarkId, Long studentId) {
        VideoBookmark bookmark = bookmarkRepository.findByIdAndStudentId(bookmarkId, studentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKMARK_NOT_FOUND));

        bookmarkRepository.delete(bookmark);
    }

    @Transactional(readOnly = true)
    public VideoBookmarkResponse getBookmarkById(Long bookmarkId, Long studentId) {
        VideoBookmark bookmark = bookmarkRepository.findByIdAndStudentId(bookmarkId, studentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOKMARK_NOT_FOUND));

        return bookmarkMapper.toResponse(bookmark);
    }
}
