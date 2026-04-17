<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# students

## Purpose
Student profile management — CRUD operations for student personal information.

## Key Files

| File | Description |
|------|-------------|
| `StudentController.java` | REST endpoints for student profile CRUD |
| `StudentService.java` | Student management business logic |
| `Student.java` | JPA entity — id, firstName, lastName, email, phoneNumber, dateOfBirth, address, timestamps |
| `StudentRepository.java` | Spring Data JPA repository |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `dto/` | StudentRequest, StudentResponse |
| `mapper/` | StudentMapper (MapStruct) |

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
