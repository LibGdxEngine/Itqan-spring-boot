<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# enrollments

## Purpose
Student-course enrollment management and per-lesson progress tracking.

## Key Files

| File | Description |
|------|-------------|
| `EnrollmentController.java` | Enroll, unenroll, get enrollment status, mark lesson progress |
| `EnrollmentService.java` | Enrollment logic, completion tracking |
| `Enrollment.java` | JPA entity — studentId, courseId, status, enrolledAt, completedAt |
| `LessonEnrollment.java` | JPA entity — lessonId, studentId, isCompleted, completedAt |
| `EnrollmentStatus.java` | Enum — ACTIVE, COMPLETED, DROPPED |
| `EnrollmentRepository.java` | Enrollment data access |
| `LessonEnrollmentRepository.java` | Lesson progress data access |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `dto/` | EnrollmentRequest, EnrollmentResponse |
| `mapper/` | EnrollmentMapper (MapStruct) |

## For AI Agents

### Working In This Directory
- Enrollments are created by the payments feature after successful checkout
- Lesson progress is tracked per-student per-lesson via `LessonEnrollment`
- Course completion status is derived from individual lesson completions

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
