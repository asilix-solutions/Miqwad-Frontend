# هاند أوفر — مشروع Maqwad (مقود) — جلسة: الطلبات + العناوين + التشليح + تحديثات المزوّدين

> **اقرأ هذا الملف أولاً وبعناية قبل استئناف العمل.** يلخّص كل ما أُنجز، القرارات المعمارية، القيود المكتشفة، وأين وقفنا بالضبط.

---

## 1) نظرة عامة على المشروع

- **المشروع:** Maqwad (مقود) — منصّة سيارات. الواجهة: **React 19 + TypeScript (strict) + Tailwind CSS v4**، **RTL أولاً**، ثنائي اللغة (عربي/إنجليزي عبر i18next).
- **الريبو:** `asilix-solutions/Miqwad-Frontend`. الفرع الرئيسي للتكامل: **`Develop`**، ومنه يُدمج إلى **`main`**.
- **الباك إند الحيّ:** `https://miqwad-test.runasp.net` (.NET على IIS). التوثيق: `https://miqwad-test.runasp.net/swagger/index.html` و`swagger/v1/swagger.json`.
- **البنية المعمارية:** modular — كل ميزة في `src/modules/<feature>/` بمجلدات فرعية (`api/`, `components/`, `hooks/`, `pages/`, `schemas/`, `lib/`, `types.ts`). المشترك في `src/shared/`. الروابط في `src/app/router.tsx`، الترجمات في `src/app/i18n.ts`.

---

## 2) منهجية العمل الثابتة (مهمة جداً — اتبعها دائماً)

1. **التشخيص أولاً دائماً (READ-ONLY)** قبل أي بناء. لا نبني على تخمين أبداً. كل مرة خمّنّا فيها قيمة بدل رؤيتها حياً، كلّفنا جولة إعادة عمل كاملة.
2. **الـ Swagger يوثّق الطلبات فقط، لا الردود.** السلوك الحقيقي (اشتقاق providerId من JWT، شكل الرد، القيم المقبولة) يُكشف فقط بـ **probe حيّ بتوكن حقيقي**.
3. **`BACKEND_API_REQUIREMENTS.md` غير موجود ولا علاقة له بأي شيء — يُتجاهل كلياً** في كل المهام والبرومبتات.
4. **تقسيم الأدوار:** المساعد يصيغ **البرومبتات** للوكيل (Claude Code) ويتّخذ القرارات المعمارية/البصرية؛ المستخدم ينفّذها ويعيد النتائج/الصور.
5. **دورة كل مهمة:** فرع جديد → تشخيص → بناء (على مراحل عند اللزوم) → **اختبار حيّ** → commit (مع بوابة تحقق: نطاق نظيف + `tsc -b --noEmit` نظيف) → PR → دمج في `Develop` ثم `main`.
6. **قواعد الكود:** named exports، JSDoc على رأس كل ملف، بلا `any`، RTL بالخصائص المنطقية (`ps/pe/ms/me`)، ترجمات ثنائية (ar+en)، حالات Loading/Error/Empty لكل صفحة، **stringify للـ ids عند حدّ الـ adapter** (قاعدة المشروع).
7. **قائمة فارغة ≠ خطأ.** `200 + []` يجب أن يعرض حالة Empty ودّية، لا Error. (كسر شائع في الـ adapter — تأكّد أن `fromRawPage` يتحمّل المصفوفة الفارغة/null).
8. **حدّ `PageSize` في الباك إند = 100** (200 يعطي 400). كل قوائم مرقّمة تستخدم `PageSize=100`.

---

## 3) ما أُنجز في هذه الجلسة (PRs مدموجة #32 → #42)

| PR | المهمة | الحالة |
|----|--------|--------|
| #32 | قسم المرفقات (Attachments) — أدمن | مدموج |
| #33 | إصلاح الدخول بالهاتف (`/phone/login` + `/api/auth/phone/verify`) | مدموج |
| #34 | دمج شامل في `main` | مدموج |
| #35 | منتجات التاجر ↔ `/api/provider-services` (كتالوج) | مدموج |
| #36 | قسم العناوين (Addresses) — أدمن + خريطة تفاعلية | مدموج |
| #37 | إصلاح أسماء ملّاك العناوين + فلترة بالاسم | مدموج |
| #38 | قسم الطلبات (Orders) — أدمن، المرحلة 1 (CRUD) | مدموج |
| #39 | الطلبات — المرحلة 2 (badges، إحصائيات، فلاتر) | مدموج |
| #41 | تحديث منتجات التاجر: صور (multipart) + `isCompatibleWith` | مدموج |
| #42 | كتالوج قطع التشليح (قطعي) + رفع كود مشترك `@shared/provider-services` | مدموج |

---

## 4) تفاصيل الربط لكل قسم (endpoints + قرارات + قيود)

### 4.1 المرفقات (Attachments) — أدمن — `/admin/attachments`
- **Endpoints:** `POST/GET /api/attachments`, `GET/PUT/DELETE /api/attachments/{id}`.
- **الرفع:** `multipart/form-data` (`File` + `UserId`). الـ GET يرجع مصفوفة مباشرة (لا pagination في وقتها). DELETE يرجع 200 (لا 204).
- **entity:** `{ id, originalFileName, filePath (URL كامل), contentType, type (enum رقمي 1/2 — معناه غير مؤكّد), fileSize, createdAt, userName }`.
- **القرار:** `userName` أُضيف لاحقاً من الباك إند (فلا حاجة لخريطة أسماء). تاب "حسب المستخدم" (تجميع client-side حسب `userName` الفريد). عرض المالك على الكارد.
- **بنود معلّقة للباك إند:** معنى `type` الرقمي؛ حقل `status` للاعتماد (مؤجّل — الـ seam جاهز).

### 4.2 الدخول بالهاتف
- **Endpoints:** `POST /phone/login` (بلا بادئة `/api`! عبر `rootApiClient`) → يرسل OTP؛ `POST /api/auth/phone/verify` (بالبادئة، `{ phoneNumber, otp }`).
- **قيد مهم:** الدخول بالهاتف **للعملاء (Customers) فقط** — يرفض الأدمن/غيرهم بـ 401 ("not a customer account"). الأدمن يدخل بالبريد عبر `/api/auth/login`.
- **صيغة الهاتف:** يُرسل بصيغة `00966` + الرقم المحلي (9 خانات) = 14 خانة. helper `toBackendPhone` في `src/modules/auth/lib/phone.ts` يحوّل عند حدّ الإرسال فقط (المستخدم يُدخل محلياً، الـ `+966` في الواجهة تزييني).

### 4.3 منتجات التاجر (Dealer Products) ↔ provider-services
- **Endpoint:** `/api/provider-services` (كتالوج مزوّد، **ليس** order line-item كما بدا في Swagger). **`providerId` يُشتقّ من JWT** (لا يُرسل).
- **الموطن:** `/provider/dealer/products` (تحت `DealerLayout`؛ التاجر يُوجَّه دائماً لـ `/provider/dealer/dashboard`).
- **النموذج:** "منتج التاجر = غلاف بسيط": يختار خدمة من كتالوج الأدمن (`GET /api/Services`) + سعر + كمية + ملاحظات. (حُذف الاسم الحرّ/الصور القديمة/SKU من النموذج القديم الوهمي).
- **تحديث #41 (صور + توافق):** `POST/PUT` صارا **`multipart/form-data`**. الحقول: `ServiceId, Quantity, Price, Notes, IsCompatibleWith, Files[]`. الـ GET يرجع `attachments[]` (صور بـ URLs).
  - **قيود مؤكّدة حياً:** السعر العشري يُرفض عبر multipart في بعض الصيغ → نقبل **أرقاماً صحيحة** مؤقتاً. **لا مسار لحذف الصور** (DELETE على المرفق يرجع 401) → الصور **إضافية فقط** عند التعديل، ولا نبني زر حذف. `isCompatibleWith` = **نص حرّ** مع placeholder مرشد.

### 4.4 العناوين (Addresses) — أدمن — `/admin/addresses`
- **Endpoints:** `GET/POST /api/Addresses` (paginated + فلترة/فرز)، `GET/PUT/DELETE /api/Addresses/{id}`.
- **entity:** `{ id, userId, title, description, shortNumber (إجباري!), longitude, latitude, createdAt }`. **`userId` من JWT** (لا يُرسل). POST يرجع **201**.
- **القرارات:** قسم أدمن. **خريطة Leaflet تفاعلية** (نقر/سحب لتحديد الموقع) — react-leaflet v5 موجود. `shortNumber` حقل إجباري بتلميح. العرض: **بطاقات + خريطة مصغّرة ثابتة** لكل عنوان (لا overlay).
- **فلترة بالمستخدم (#37):** الأدمن يختار **اسم** المستخدم من dropdown، والتطبيق يرسل `userId` رقمياً داخلياً (`FilterBy=userId&FilterValue={id}`). **الاسم يُعرض** عبر خريطة `userId→fullName` من `/api/Users`.
  - **قيد حاسم مكتشف:** `/api/Users` يفلتر حسابات الأدمن افتراضياً (`adaptUserList` في `adminApi.ts`). أُضيف param **`includeAdmins`** (default false) — تمرّره صفحة العناوين `true` كي تظهر أسماء ملّاك من الأدمن. `/api/Users/{id}/addresses` **غير موجود (404)** — لا تستخدمه.

### 4.5 الطلبات (Orders) — أدمن — `/admin/orders`
- **Endpoints:** `GET /api/Orders` (paginated)، `GET/PUT/DELETE /api/Orders/{id}`. **لا إنشاء (POST) في قسم الأدمن** — الطلبات ينشئها العملاء؛ الأدمن يدير دورة الحياة (تحديث حالة/تتبّع + حذف).
- **entity:** `{ id, userId, userFullName, type, status, paymentMethod, trackNumber, createdAt }`. `userFullName` يُرجَع مباشرة في الـ GET (لا حاجة لخريطة).
- **⚠️ الـ enums: القراءة نصّية، الكتابة رقمية.** الجداول (من Swagger x-enumNames، كلها تبدأ من 1):
  - **OrderStatus:** 1=InWaiting, 2=Ready, 3=Shipped, 4=Received, 5=Canceled
  - **OrderType:** 1=SpareParts, 2=Salvage, 3=TowTruck, 4=Insurance, 5=Mojaz
  - **PaymentMethod:** 1=Cash, 2=CreditCard, 3=DebitCard, 4=BankTransfer
  - PUT يرسل الأرقام؛ الفورم يبقى في فضاء الأسماء ويحوّل عند حدّ الـ API (`lib/orderEnums.ts`).
- **المرحلة 2 (#39):** badges ملوّنة للحالة، شريط إحصائيات (عدّ client-side)، فلاتر + فرز.
  - **قيد حاسم للفلترة:** `FilterBy` في الباك إند **whitelist لحقل واحد: `trackNumber`** فقط. فلترة `status`/`type` عبر `FilterBy` تعطي **400**. لذا: البحث (trackNumber) + التاريخ = server-side؛ **الحالة/النوع = فلترة client-side** على الصفحة المُحمّلة. (dropdown الحالة المكرّر أُزيل؛ شريط الإحصائيات هو فلتر الحالة).

### 4.6 كتالوج قطع التشليح (Scrap Parts) — "قطعي" — `/provider/scrap/parts`
- **نفس** `/api/provider-services` (مؤكّد حياً بتوكن تشليح: role=SalvageSpecialist، سلوك مطابق للتاجر byte-for-byte — GET /api/Services=200، CRUD كامل بالصور، providerId من JWT).
- **قرار معماري كبير:** رُفع الكود العام لـ **`src/shared/provider-services/`** (api + adapter + types + schema + ImagesPicker) — **يشاركه التاجر والتشليح** (مصدر واحد، سابقة `@shared/provider-ui`). التاجر أُعيد توجيه استيراداته للمشترك (`Product = ProviderService` alias) — **تأكّد دائماً أن التاجر لم ينكسر بعد أي تعديل على المشترك**.
- **hooks تشليح منفصلة:** `useScrapPartsQueries` (queryKey جذره "scrap-parts").
- **الموطن:** أُعيد توجيه قسم "عروضي" القديم (mock بلا backend) → كتالوج القطع الحقيقي. المسمّى الجديد **"قطعي"** (`scrap.nav.parts`). المسار `/provider/scrap/parts`.
- **كود offer/escrow القديم (mock):** **تُرك خاملاً** (لا حذف، لا ربط بالـ nav) — لمستقبل التفاوض حين يبنيه الباك إند.

---

## 5) قرارات معمارية عامة متكرّرة

- **stringify للـ ids** عند حدّ الـ adapter (القراءة string في الواجهة، parse للأرقام عند الكتابة).
- **الـ proxy:** axios `baseURL = /api` نسبي؛ خادم Vite dev (`localhost:5173`) يمرّر `/api/*` للباك إند الحقيقي. رؤية `localhost` في Network **سليمة** (proxy تطوير) — الدليل: `server: Microsoft-IIS` في ردود الباك إند.
- **رفع الكود المشترك** لـ `@shared/` عند تشارك أكثر من مزوّد للمنطق (dealer/scrap/workshop) — يخدم مرونة المشروع.
- **stale bundle:** أعراض "مفاتيح i18n خام" أو "صفحة تُحمّل ثم redirect" قد تكون نسخة Vite قديمة — جرّب restart نظيف + hard-refresh قبل افتراض خلل في المصدر.

---

## 6) بنود معلّقة على الباك إند (موثّقة — نعود إليها عند التحديث)

1. **الشات** (تفاعل العميل مع التشليح/المزوّد) — مؤجّل حتى يبنيه الباك إند؛ حينها نربطه (يوجد placeholder معطّل حالياً).
2. **السعر العشري** في provider-services (multipart يرفضه) — نقبل أرقاماً صحيحة مؤقتاً.
3. **حذف الصور** في provider-services — لا مسار backend؛ الصور إضافية فقط.
4. **`isCompatibleWith`** — نص حرّ الآن؛ لو أضاف الباك إند ربطاً بـ Brands/Models → نطوّره لمنتقي مركبات.
5. **`type` enum في المرفقات** (1/2) — معناه غير مؤكّد.
6. **حقل `status`** للمرفقات (اعتماد الأدمن) — مؤجّل؛ الـ seam جاهز.
7. **نموذج offer/escrow للتشليح** — mock فقط بلا backend؛ خامل حتى يُبنى.

---

## 7) أنواع المزوّدين (سياق مهم للمهام القادمة)

ثلاثة أنواع تختلف في وظيفتها:
- **التاجر (Dealer):** يضيف **منتجات** (عبر provider-services). ✅ مُنجز.
- **التشليح (Scrap/SalvageSpecialist):** يضيف **قطعاً** (عبر provider-services). ✅ مُنجز.
- **الورش (Workshop):** **دليل فقط** — لا إضافة (على الأرجح). ⏳ لم يُبنَ بعد.

`/api/public/*` (categories, brands, provider-services, salvages, workshops, tows, offers) موجودة للعرض العام في التطبيق.

---

## 8) حسابات اختبار (بيئة test)

- **أدمن:** يُستخدم لأقسام الأدمن (المرفقات/العناوين/الطلبات).
- **تجار:** `TestDealer2@gmail.com` / `Passwrod@123` (userId 33)، `TestDealer3@gmail.com` / `Passwrod@123` (userId 46). (انتبه: `Passwrod` بخطأ إملائي مقصود). `TestDealer1` بريده غير موثّق.
- **تشليح:** `TestScrap1@gmail.com` (userId 40, role=SalvageSpecialist).
- التوكنات تنتهي صلاحيتها بسرعة — احصل على توكن طازج عند الـ probe.

---

## 9) أين وقفنا / المهمة التالية المحتملة

- **جلسة التشليح مكتملة ومدموجة (#42).**
- **مرشّحات للمهمة التالية:**
  - **الورش (Workshop)** — النوع الثالث من المزوّدين (تأكيد endpoints أولاً — دليل فقط؟).
  - **الشات** — حين يبنيه الباك إند (يربط التشليح/المزوّدين بالعملاء).
  - أي جزئية جديدة يقدّم المستخدم endpoints لها.
  - بنود صيانة/تحسين من القائمة أعلاه.

**قبل أي مهمة جديدة:** فرع جديد → تشخيص READ-ONLY أولاً → probe حيّ عند اللزوم.
