# Itqan Education Platform

منصة تعليمية احترافية مبنية على Spring Boot + Next.js باستخدام أفضل الممارسات في التطوير.

## 🏗️ البنية المعمارية

المشروع يستخدم **Monorepo** مع **Vertical Slice Architecture**:

```
itqan/
├── backend/          # Spring Boot Application
├── frontend/         # Next.js Application
├── compose.yaml      # Docker Compose للبيئة المحلية
└── README.md
```

## 🚀 البدء السريع

### المتطلبات الأساسية

- Java 21+ (للاستفادة من Virtual Threads)
- Node.js 18+
- Maven 3.8+
- Docker & Docker Compose

### 1. إعداد Backend و Frontend (Docker)

```bash
# إنشاء ملف .env من المثال
cp .env.example .env

# عدّل ملف .env حسب البيئة (development/production)
# للتطوير: اترك القيم الافتراضية
# للإنتاج: غيّر PASSWORDS, SECRETS, و JPA_HIBERNATE_DDL_AUTO=validate

# تشغيل جميع الخدمات
docker compose up --build -d

# أو للتشغيل في المقدمة (لرؤية السجلات)
docker compose up --build
```

**جميع الخدمات تعمل الآن في Docker containers:**
- Backend API: `http://localhost:8080`
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:5433` (أو حسب POSTGRES_PORT في .env)
- pgAdmin: `http://localhost:5050` (إذا كان ENABLE_PGADMIN=true)

**لتشغيل pgAdmin (اختياري):**
```bash
docker compose --profile pgadmin up -d pgadmin
```

**للتطوير المحلي (بدون Docker):**
```bash
cd backend
# تأكد أن PostgreSQL يعمل أولاً
docker compose up -d postgres

# تشغيل Backend محلياً
./mvnw spring-boot:run

# في terminal آخر - تشغيل Frontend
cd frontend
npm run dev
```

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- API Docs: `http://localhost:8080/v3/api-docs`

### 2. إعداد Frontend

```bash
cd frontend

# تثبيت التبعيات
npm install

# توليد APIs تلقائياً من Backend
# تأكد أن Backend يعمل أولاً
npm run generate-api

# تشغيل التطبيق
npm run dev
```

Frontend سيعمل على: `http://localhost:3000`

## 📦 الميزات الرئيسية

### Backend (Spring Boot)

- ✅ **Docker Compose Support**: Spring Boot يشغل PostgreSQL تلقائياً
- ✅ **DevTools**: إعادة تشغيل تلقائية عند التعديل
- ✅ **JWT Authentication**: نظام مصادقة آمن
- ✅ **Global Exception Handling**: معالجة موحدة للأخطاء باستخدام ProblemDetails (RFC 7807)
- ✅ **Validation**: تحقق تلقائي من المدخلات
- ✅ **MapStruct**: تحويل Entity ↔ DTO تلقائياً
- ✅ **OpenAPI/Swagger**: توثيق APIs تلقائياً
- ✅ **Vertical Slice Architecture**: هيكلية قابلة للتوسع

### Frontend (Next.js)

- ✅ **TypeScript**: نوع آمن للكود
- ✅ **Tailwind CSS**: تصميم سريع وحديث
- ✅ **OpenAPI Generation**: توليد APIs تلقائياً من Backend
- ✅ **App Router**: أحدث ميزات Next.js

## 🗂️ هيكلية المشروع

### Backend Structure

```
backend/src/main/java/com/itqan/edu/
├── common/                    # Shared Kernel
│   ├── config/                # Security, OpenAPI, etc.
│   ├── exception/             # Global Exception Handler
│   ├── security/              # JWT Authentication
│   └── utils/
│
├── features/                   # Vertical Slices
│   ├── auth/                  # Authentication Feature
│   ├── courses/               # Courses Feature
│   └── students/              # Students Feature
│
└── Application.java
```

### Frontend Structure

```
frontend/src/
├── app/                       # Next.js App Router
├── components/                # React Components
├── lib/
│   └── api/                   # Generated API Client
└── hooks/                     # Custom Hooks
```

## 🔐 المصادقة (Authentication)

المشروع يستخدم JWT Authentication:

1. **التسجيل**: `POST /api/auth/register`
2. **تسجيل الدخول**: `POST /api/auth/login`
3. **استخدام Token**: أضف `Authorization: Bearer <token>` في Header

## 🗄️ قاعدة البيانات

- **PostgreSQL**: قاعدة البيانات الرئيسية
- **pgAdmin**: واجهة إدارة قاعدة البيانات على `http://localhost:5050`
  - Email: `admin@itqan.edu`
  - Password: `admin`

### الاتصال بقاعدة البيانات

```properties
Host: localhost
Port: 5432
Database: itqan_edu
Username: postgres
Password: postgres
```

## 📝 APIs

### Authentication APIs

- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل الدخول

### Courses APIs

- `GET /api/courses` - جلب جميع الكورسات
- `GET /api/courses/{id}` - جلب كورس محدد
- `POST /api/courses` - إنشاء كورس جديد
- `PUT /api/courses/{id}` - تحديث كورس
- `DELETE /api/courses/{id}` - حذف كورس

### Students APIs

- `GET /api/students` - جلب جميع الطلاب
- `GET /api/students/{id}` - جلب طالب محدد
- `POST /api/students` - إنشاء طالب جديد
- `PUT /api/students/{id}` - تحديث طالب
- `DELETE /api/students/{id}` - حذف طالب

## 🔧 التطوير

### توليد APIs في Frontend

بعد تعديل أي Controller في Backend:

```bash
cd frontend
npm run generate-api
```

هذا سيقوم بـ:
1. جلب `openapi.json` من Backend
2. توليد TypeScript Client & Types تلقائياً

### إعدادات التطوير

- **Backend**: DevTools يعيد التشغيل تلقائياً عند التعديل
- **Frontend**: Hot Reload يعمل تلقائياً

## 🐳 Docker Compose

المشروع يستخدم ملف Docker Compose واحد (`compose.yaml`) مع ملف `.env` واحد للتحكم في جميع الإعدادات.

### الإعداد:

```bash
# إنشاء ملف .env من المثال
cp .env.example .env

# عدّل .env حسب البيئة:
# - للتطوير: اترك القيم الافتراضية
# - للإنتاج: غيّر PASSWORDS, SECRETS, JPA_HIBERNATE_DDL_AUTO=validate, RESTART_POLICY=always
```

### الأوامر المفيدة:

```bash
# تشغيل جميع الخدمات
docker compose up -d

# إيقاف جميع الخدمات
docker compose down

# رؤية السجلات
docker logs itqan-backend -f
docker logs itqan-frontend -f

# إعادة بناء service محدد
docker compose up -d --build backend

# تشغيل pgAdmin (اختياري)
docker compose --profile pgadmin up -d pgadmin
```

## 📚 التقنيات المستخدمة

### Backend
- Spring Boot 3.2.0
- Java 21 (with Virtual Threads support)
- Spring Security
- Spring Data JPA
- PostgreSQL
- JWT (jjwt)
- MapStruct
- Lombok
- Springdoc OpenAPI

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Axios
- OpenAPI TypeScript Codegen

## 🤝 المساهمة

1. Fork المشروع
2. أنشئ Branch للميزة (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى Branch (`git push origin feature/AmazingFeature`)
5. افتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License.

## 👥 الفريق

Itqan Education Platform Team

---

**ملاحظة**: هذا المشروع مبني باستخدام أفضل الممارسات في التطوير لضمان سرعة التطوير (High Velocity) وقابلية التوسع (Scalability).
