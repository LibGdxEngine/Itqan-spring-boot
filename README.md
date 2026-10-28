# Itqan Education Platform

منصة تعليمية ثنائية اللغة (العربية والإنجليزية) مبنية على Spring Boot و Next.js: كورسات بالفيديو والمقالات والاختبارات، شهادات قابلة للتحقق، تقييمات، لوحة إدارة، واستوديو للمدرّسين.

## 🏗️ البنية

المشروع **Monorepo** يستخدم **Vertical Slice Architecture** في الـ Backend:

```
Itqan-spring-boot/
├── backend/        # Spring Boot 3.5 (Java 21) — REST API
├── frontend/       # Next.js 16 (React 19) — الواجهة
├── monitoring/     # إعدادات Prometheus و Grafana
├── scripts/        # النشر، النسخ الاحتياطي والاستعادة
├── compose.yaml    # كل الخدمات مع Profiles
├── Caddyfile       # Reverse proxy مع HTTPS تلقائي (production)
└── .env.example    # قالب الإعدادات
```

## 🚀 البدء السريع

### المتطلبات

- Docker و Docker Compose
- للتطوير بدون Docker: Java 21، Maven 3.9، Node.js 20

### التشغيل للتطوير

```bash
cp .env.example .env
COMPOSE_PROFILES=dev docker compose up --build
```

| الخدمة | العنوان |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:8080` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| PostgreSQL | `localhost:5433` |
| MinIO (تخزين الفيديو) | `http://localhost:9000` (Console على `9001`) |
| Meilisearch | `http://localhost:7700` |

> العربية هي اللغة الافتراضية على الرابط العادي، والإنجليزية بإضافة `?lang=en`.

أوامر مختصرة موجودة في `Makefile`: `make dev-build`، `make dev-logs`، `make dev-down`، `make prod-build`.

### التشغيل في Production

```bash
cp .env.example .env.production
# غيّر كل كلمات المرور والأسرار، واضبط DOMAIN و NEXT_PUBLIC_SITE_URL
COMPOSE_PROFILES=prod docker compose --env-file .env.production up -d --build
```

- الـ Backend يرفض التشغيل في `prod` إذا كانت بيانات الدخول الافتراضية مستخدمة.
- Flyway يدير قاعدة البيانات، و Hibernate يتحقق فقط (`ddl-auto=validate`).
- Caddy يصدر شهادة HTTPS تلقائياً ويحجب `/actuator` عن الإنترنت.

> ⚠️ صور MinIO على `quay.io/minio` لم تعد متاحة للتحميل العام. الصور الموجودة محلياً تعمل، لكن أي سيرفر جديد يحتاج مصدراً آخر للصورة أو بديلاً متوافقاً مع S3.

## 🧪 الاختبارات

### Backend

```bash
cd backend
mvn test                # سريع، على H2
mvn -Ppostgres test     # على PostgreSQL 16 حقيقي عبر Testcontainers (يحتاج Docker)
```

الوضع `-Ppostgres` يطبّق كل Flyway migrations ثم يتحقق أن الـ Entities تطابق الجداول، فيكشف أي migration ناقصة قبل النشر.

### Frontend

```bash
cd frontend
npm run lint
npm run typecheck
npm run test:run        # Vitest + Testing Library
npm run build
```

### اختبارات End-to-End (Playwright)

تحتاج Backend و Frontend شغّالين، وحساب الـ super admin الخاص بالـ Backend:

```bash
cd frontend
npx playwright install chromium
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npm run test:e2e
```

تنشئ الاختبارات كورساً مجانياً خاصاً بها، ثم تتحقق من الصفحات العامة ومن رحلة الطالب كاملة: تسجيل الدخول ← الاشتراك ← إكمال الدرس ← الحصول على الشهادة.

## 🛠️ التشغيل والمراقبة

### النسخ الاحتياطي

يعمل تلقائياً مع `prod` (أو وحده بـ `COMPOSE_PROFILES=backup`):

- **قاعدة البيانات**: نسخة يومية مضغوطة الساعة `BACKUP_DB_TIME` (افتراضياً 02:00)، ويُحذف ما هو أقدم من `BACKUP_RETENTION_DAYS` يوماً.
- **الفيديوهات والملفات**: نسخة يومية من الـ bucket الساعة `BACKUP_FILES_TIME` (افتراضياً 03:00) باستخدام rclone.
- **نسخة خارجية (اختيارية)**: عند ضبط `BACKUP_S3_*` تُرفع النسختان إلى أي تخزين متوافق مع S3.

كل النسخ محفوظة في الـ volume `backup_data`. للاستعادة (أوقف الـ Backend أولاً):

```bash
scripts/db-restore.sh itqan_edu_20260101_020000.sql.gz
```

### المراقبة (Prometheus + Grafana)

```bash
# في .env.production: METRICS_SCRAPE_TOKEN و GRAFANA_ADMIN_PASSWORD (قيم عشوائية طويلة)
COMPOSE_PROFILES=prod,monitoring docker compose --env-file .env.production up -d
```

- Prometheus على `127.0.0.1:9090`، و Grafana على `127.0.0.1:3001` مع مصدر بيانات جاهز.
- تنبيهات جاهزة في `monitoring/alerts.yml`: توقف الـ Backend، ونسبة أخطاء 5xx عالية، وبطء الـ API، وامتلاء اتصالات قاعدة البيانات، وامتلاء الذاكرة.
- الـ Backend يعرض المقاييس على `/actuator/prometheus` (يحتاج `METRICS_SCRAPE_TOKEN` أو حساب مدير).

### تتبع الأخطاء (Sentry)

اختياري ومعطّل افتراضياً. اضبط `SENTRY_DSN` للـ Backend و `SENTRY_DSN_FRONTEND` للواجهة. الأخير يُضمَّن وقت البناء، لذا أعد بناء الـ frontend بعد تغييره.

## 🔧 ملاحظات للتطوير

- بعد تعديل أي Controller، أعد توليد الـ API client: `cd frontend && npm run generate-api` (يحتاج Backend شغّالاً).
- أي تغيير في قاعدة البيانات يحتاج migration جديدة في `backend/src/main/resources/db/migration` (مثل `V7__...sql`).
- النصوص في `frontend/messages/ar.json` و `en.json`، ويجب إضافة أي مفتاح جديد في الملفين.
- دليل تفصيلي للمطوّرين وأدوات الذكاء الاصطناعي في `AGENTS.md`.

## 📚 التقنيات

**Backend:** Spring Boot 3.5، Java 21، Spring Security + JWT، JPA/Hibernate، Flyway، PostgreSQL 16، Redis، MinIO/S3، Meilisearch، Stripe، Micrometer، Sentry

**Frontend:** Next.js 16، React 19، TypeScript، Tailwind CSS 4، Radix UI، next-intl، Recharts، dnd-kit، Vitest، Playwright

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License.
