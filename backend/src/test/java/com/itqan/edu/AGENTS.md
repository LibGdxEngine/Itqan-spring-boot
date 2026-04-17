<!-- Parent: ../../../../../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# tests (com.itqan.edu)

## Purpose
Integration and unit tests for the backend, mirroring the main source package structure. Uses H2 in-memory database for test isolation.

## Key Files

| File | Description |
|------|-------------|
| `config/BaseIntegrationTest.java` | Abstract base class for integration tests — H2 setup and Spring context |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `config/` | Test configuration and base classes |
| `features/admins/` | Admin CRUD endpoint tests |
| `features/auth/` | Auth, Google OAuth, and password reset flow tests |
| `features/courses/` | Module service tests |
| `features/payments/` | Payment, coupon, and integration tests |

## For AI Agents

### Working In This Directory
- Extend `BaseIntegrationTest` for new integration tests
- Use `*IntegrationTest.java` naming convention
- Tests run against H2 with `application-test.properties` (PostgreSQL compatibility mode)
- Use `@SpringBootTest` + `@AutoConfigureMockMvc` for controller tests
- Keep tests isolated — reset state in `@BeforeEach` where needed
- Run with `cd backend && ./mvnw test`

### Test Files
| File | Description |
|------|-------------|
| `features/admins/AdminControllerIntegrationTest.java` | Admin CRUD endpoint tests |
| `features/auth/AuthControllerIntegrationTest.java` | Registration and login tests |
| `features/auth/GoogleAuthIntegrationTest.java` | Google OAuth flow tests |
| `features/auth/PasswordResetIntegrationTest.java` | Password reset flow tests |
| `features/courses/ModuleServiceTest.java` | Module service logic tests |
| `features/payments/PaymentServiceTest.java` | Payment processing tests |
| `features/payments/CouponServiceTest.java` | Coupon validation/redemption tests |
| `features/payments/PaymentsAndCouponsIntegrationTest.java` | End-to-end payment flow tests |

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
