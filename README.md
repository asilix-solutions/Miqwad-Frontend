# maqwad-frontend

واجهة الويب لمنصة **مقود** — مبنية وفق خطّة الـ MVP المعتمدة من قائد المشروع
(`Sprint 0` و `Sprint 1` مكتملان).

## ⚡ المُلخّص التقني

| الطبقة             | التقنية                              |
| ------------------- | ------------------------------------- |
| Build               | Vite + React 19 + TypeScript          |
| Routing             | React Router v7                       |
| State (global)      | Redux Toolkit + `react-redux`         |
| Server state        | TanStack Query                        |
| HTTP                | Axios (interceptors + refresh-token)  |
| UI                  | Tailwind CSS v4 + shadcn-style primitives + Radix UI |
| Forms               | React Hook Form + Zod                 |
| i18n                | `i18next` (عربي / English, RTL/LTR)   |
| Lint / Format       | ESLint 10 + Prettier 3 + Tailwind plugin |

## 📂 هيكلة المجلدات (Modular)

```
src/
├── app/                    # bootstrap (store, router, providers, i18n)
├── modules/                # كل وحدة عمل (Sprint) في مجلد مستقل
│   └── auth/               # Sprint 1
│       ├── api/            # طبقة النقل (Axios calls)
│       ├── components/     # مكوّنات داخل الوحدة فقط (OtpInput…)
│       ├── hooks/          # mutations / state hooks
│       ├── pages/          # شاشات الـ Auth (Login, OTP, Profile…)
│       ├── schemas/        # Zod validators
│       ├── store/          # Redux slice
│       └── types.ts        # عقد البيانات (DTOs)
├── shared/                 # عناصر مشتركة بين الوحدات
│   ├── components/
│   │   ├── feedback/       # LoadingState / ErrorState / EmptyState (DoD)
│   │   ├── layout/         # AuthLayout, AppLayout (سايدبار + توب بار)
│   │   └── ui/             # Button, Input, Card, Toast, Spinner…
│   ├── guards/             # ProtectedRoute, GuestRoute
│   ├── lib/                # axios, queryClient, storage, utils
│   ├── mocks/              # mock-adapter لـ /auth/* و /users/me
│   └── types/              # عقود مشتركة (ApiResponse, AppError)
└── styles/globals.css      # Design System tokens (Tailwind v4 @theme)
```

## 🎨 الالتزام بالـ Design System

كل المتغيّرات مأخوذة من ملفات الـ UI/UX (Section.pdf … Section-4.pdf):

- **الألوان**: `--color-brand-500: #E84427` و `--color-navy-500: #1A2A5E`
  + درجات 50→700 + ألوان Semantic (success/warning/danger/info).
- **الخطوط**: `IBM Plex Sans Arabic` للعناوين (Display) و `Tajawal` للنصوص (Body).
- **المسافات**: نظام `--spacing` على مضاعفات 4px (افتراضي Tailwind).
- **الانحناءات**: 7 مستويات `xs..2xl..pill`.
- **الظلال**: `--shadow-1..3` + `--shadow-brand` للأزرار البرتقالية.

> هذي المتغيّرات معرّفة في `src/styles/globals.css` ضمن كتلة `@theme {}` وتُستهلك مباشرة في Tailwind v4 وفي مكوّنات الواجهة.

## 🔐 تدفّق المصادقة (Sprint 1)

```
/login           → الفورم يدخل رقم الجوال
   ↓ POST /auth/register   →  verificationId + resendAfter
/verify-otp      → إدخال 6 أرقام + عداد إعادة الإرسال
   ↓ POST /auth/verify-otp →  user + accessToken + refreshToken
/complete-profile (يظهر فقط إذا user.isProfileComplete === false)
   ↓ PUT /users/me
/app/dashboard   → الواجهة المحمية (Sidebar + Topbar + Profile)
```

- الـ Token محفوظ في `localStorage` تحت Prefix `maqwad.*`.
- على أي استجابة `401` يحاول Axios استخدام `refreshToken` تلقائياً.
- الـ ProtectedRoute يعيد التوجيه لـ `/login` ويحفظ المسار الأصلي.

## 🧪 الـ Mock API (للتشغيل قبل جاهزية الباك)

الـ MVP plan يحدّد endpoints لم تُنفَّذ بعد في Swagger الباك إند:

- `POST /auth/register`, `POST /auth/verify-otp`
- `POST /auth/refresh-token`, `POST /auth/logout`
- `GET /users/me`, `PUT /users/me`, `POST /users/me/avatar`

كل هذي محاكاة بتعديل Axios adapter في `src/shared/mocks/server.ts`. يتم تفعيله بـ:

```env
VITE_USE_MOCKS=true
```

ولإيقافه (والربط بالباك الحقيقي) ضع `VITE_USE_MOCKS=false` وحدّد `VITE_API_BASE_URL`.

### بيانات اختبار جاهزة

- رقم جوال أي ما يبدأ بـ `5` ويتكون من 9 خانات (مثلاً `512345678`).
- رمز التحقق الافتراضي: **`123456`** أو آخر 6 أرقام من رقم الجوال.

## ⚙️ أوامر التطوير

```bash
cp .env.example .env
npm install
npm run dev        # تطوير على :5173
npm run typecheck  # فحص الأنواع
npm run lint       # ESLint
npm run format     # Prettier
npm run build      # bundle جاهز للإنتاج (tsc + vite build)
npm run preview    # تشغيل bundle محلياً
```

## ✅ Definition of Done (الجزء المتعلّق بالفرونت)

| المعيار | الحالة |
|---|---|
| الشاشة مطابقة للـ Design System | ✅ نفس ألوان/خطوط/انحناءات الـ PDFs |
| تدعم RTL | ✅ `<html dir="rtl">` + تبديل لغة فوري |
| متجاوبة | ✅ Layout `lg/md/sm` + Sidebar Drawer على الجوّال |
| Loading state | ✅ `LoadingState` + `Spinner` |
| Error state | ✅ `ErrorState` + `Toast` (نجاح/فشل) |
| Empty state | ✅ `EmptyState` |
| ربط فعلي بـ API | ✅ Axios + TanStack Query (مع Mocks للتجريب) |
| لا توجد console errors | ✅ |

## 🗺️ ماذا بعد (السبرنتات اللاحقة)

كل وحدة جديدة (مركبات، مقدّمو خدمة، طلبات…) تُضاف بنفس النمط:

```
src/modules/<feature>/
   api/  components/  hooks/  pages/  schemas/  store/  types.ts
```

ثم تُسجَّل route جديدة داخل `/app/*` في `src/app/router.tsx`، وتُسجَّل
slice جديدة في `src/app/store.ts`. هذا يحافظ على عزل الوحدات (DRY +
maintainability) ويسمح للمطورين بالعمل بالتوازي دون تعارض.
