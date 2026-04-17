<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# exception

## Purpose
Centralized error handling using Spring's `@ControllerAdvice`. Defines a custom `BusinessException` with typed error codes and a global handler that produces RFC 7807 ProblemDetails responses.

## Key Files

| File | Description |
|------|-------------|
| `GlobalExceptionHandler.java` | `@ControllerAdvice` — handles validation errors, auth failures, business exceptions, access denied |
| `BusinessException.java` | Custom runtime exception with `ErrorCode`, message, and optional details map |
| `ErrorCode.java` | Enum of all error codes with associated HTTP status — auth, validation, not-found, payment, coupon, quiz errors |

## For AI Agents

### Working In This Directory
- Throw `new BusinessException(ErrorCode.XXX)` in service code — never throw raw exceptions
- Add new error codes to `ErrorCode.java` with appropriate HTTP status
- `GlobalExceptionHandler` automatically converts exceptions to consistent JSON responses
- Error responses follow RFC 7807 ProblemDetails format

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
