package com.itqan.edu.features.video;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoBookmarkRepository extends JpaRepository<VideoBookmark, Long> {

    List<VideoBookmark> findByStudentIdAndLessonIdOrderByTimestampAsc(Long studentId, Long lessonId);

    List<VideoBookmark> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    Optional<VideoBookmark> findByIdAndStudentId(Long id, Long studentId);

    void deleteByIdAndStudentId(Long id, Long studentId);
}
