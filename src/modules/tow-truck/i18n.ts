export const towTruckAr = {
  opsRejectedRefresh:
    "تعذر تحديث البيانات بعد الرفض. هذه آخر بيانات محملة؛ حدّثها قبل مراجعة محاولة جديدة.",
  opsTitle: "إدارة السائق",
  opsOrderAction: "السائق المعين لهذا الطلب",
  opsRemoveOnly: "إزالة السائق تخص هذا الطلب فقط؛ لا تعطل حسابه ولا تلغي الطلب أو تسترد الدفع.",
  opsAccountTitle: "حالة حساب السائق",
  opsAccountScope:
    "التفعيل والتعطيل يؤثران على دخول السائق إلى حسابه، ولا يغيران إسناد الطلب تلقائيًا ولا يثبتان توفره للعمل.",
  opsManageAccounts: "إدارة حساب سائق سطحة",
  opsOrderPermission: "إزالة السائق تتطلب صلاحية إدارة الطلبات.",
  opsViewPermission: "عرض حساب السائق يتطلب صلاحية عرض المستخدمين.",
  opsAccountPermission: "يمكنك عرض الحساب، لكن لا تملك صلاحية تغيير حالته.",
  opsOtherOperation:
    "توجد عملية تعيين أو نتيجة سابقة لم تُحسم. تحقّق من نتيجتها قبل إجراء تغيير آخر.",
  opsRemoveTitle: "إزالة السائق من الطلب؟",
  opsRemovePaidTitle: "إزالة السائق من طلب مدفوع؟",
  opsRemoveHint:
    "سيُرسل طلب إزالة السائق فقط. لن يُلغى الطلب أو يُرد مبلغ أو تُعدّل الأسعار تلقائيًا.",
  opsRemovePaidHint:
    "هذا الطلب مدفوع. إزالة السائق لا تعني إلغاء الطلب أو استرداد المبلغ. راجع أثر الإزالة على متابعة الطلب قبل التأكيد؛ قد يرفض الخادم الإجراء.",
  opsRemoveUnknownHint:
    "حالة الدفع غير مؤكدة. قد يكون الطلب مدفوعًا؛ إزالة السائق لا تلغي الطلب ولا تسترد المبلغ. تحقّق من الأثر المالي والتشغيلي قبل المتابعة.",
  opsRiskConfirm: "راجعت حالة الدفع وأفهم أن إزالة السائق لا تلغي الطلب ولا تسترد المبلغ.",
  opsRiskRequired: "راجع تحذير الدفع وأكّده قبل إرسال طلب الإزالة.",
  opsPaid: "مدفوع",
  opsConfirm_remove: "تأكيد إزالة السائق",
  opsConfirm_activate: "تأكيد تفعيل الحساب",
  opsConfirm_deactivate: "تأكيد تعطيل الحساب",
  opsActivate: "مراجعة تفعيل حساب السائق",
  opsDeactivate: "مراجعة تعطيل حساب السائق",
  opsActivateHint:
    "سيُطلب تفعيل هذا الحساب. التفعيل لا يعني أن السائق متاح الآن ولا يعيّنه لأي طلب.",
  opsDeactivateHint:
    "سيُطلب تعطيل هذا الحساب بالسبب الموضح. هذا الإجراء لا يزيل السائق من الطلبات ولا يلغيها؛ قد يرفض الخادم التعطيل بسبب التزامات قائمة.",
  opsReason: "سبب تعطيل الحساب",
  opsReasonHelp: "اكتب سببًا واضحًا من 1 إلى 500 حرف. تجنّب إدراج بيانات حساسة غير لازمة.",
  opsReasonRequired: "أدخل سبب تعطيل الحساب.",
  opsReasonLong: "يجب ألا يتجاوز السبب 500 حرف.",
  opsReasonInvalid: "أدخل سببًا صالحًا من 1 إلى 500 حرف.",
  opsReasonDraft: "سبب التعطيل محفوظ في هذه الصفحة. امسح حقل السبب إذا أردت اختيار حساب آخر.",
  opsActive: "الحساب نشط",
  opsInactive: "الحساب معطّل",
  opsAvailability: "التوفر الحالي غير معروف. حالة الحساب لا تثبت أن السائق متصل أو متاح.",
  opsAssignedAccountHint:
    "هذا هو السائق المعين للطلب. تغيير حالة حسابه عملية مستقلة عن إزالته من الطلب.",
  opsLoadingAccount: "جارٍ التحقق من حساب السائق…",
  opsAccountReadFailed: "تعذر التحقق من حساب السائق. حدّث بياناته قبل مراجعة الإجراء.",
  opsReviewRemoval: "مراجعة إزالة السائق",
  opsEditReview: "العودة للمراجعة",
  opsClose: "إغلاق",
  opsCancel: "إلغاء",
  opsChecking: "جارٍ التحقق من أحدث البيانات…",
  opsSending: "جارٍ إرسال الإجراء…",
  opsSuccess_remove:
    "تمت إزالة السائق وتحديث بيانات الطلب. لم يُرسل طلب إلغاء أو استرداد أو تغيير للسعر.",
  opsSuccess_activate: "تم تفعيل حساب السائق وتأكيد حالته من الخادم.",
  opsSuccess_deactivate: "تم تعطيل حساب السائق وتأكيد حالته من الخادم.",
  opsContext: "الطلب #{{order}} · حساب السائق #{{driver}}",
  opsFinancialWarning:
    "راجع القيم المالية الحالية: تغيّرت منذ المراجعة أو تعذر مقارنتها. لم ننفّذ تعديلًا ماليًا أو استردادًا.",
  opsChanged:
    "تغيّرت بيانات الطلب أو السائق أو الدفع. لم يُرسل إجراء جديد؛ راجع البيانات وحدّث التأكيد.",
  opsAccountChanged:
    "تغيّرت بيانات الحساب أو حالته أو تعذر تأكيد هويته. لم يُرسل إجراء؛ حدّث الحساب وراجعه.",
  opsIdentity:
    "تعذر تأكيد هوية سائق سطحة وحالة حسابه. حدّث البيانات؛ لا يمكن تغيير حساب غير متحقق منه.",
  opsForbidden: "لا تملك الصلاحية المطلوبة الآن. لم نعد إرسال الإجراء؛ تواصل مع مسؤول الصلاحيات.",
  opsAuthentication:
    "تعذر التحقق من جلسة الدخول. احتفظ بمسودتك قبل تسجيل الدخول مجددًا، ثم تحقّق من البيانات.",
  opsValidation:
    "رفض الخادم الإجراء أو بياناته. راجع الحساب والطلب والسبب إن وجد قبل تأكيد محاولة جديدة.",
  opsMissing: "الطلب أو حساب السائق غير متاح. حدّث البيانات قبل متابعة أي إجراء.",
  opsConflict:
    "رفض الخادم الإجراء لتعارض مع الحالة الحالية. قد توجد التزامات قائمة؛ حدّث البيانات وراجعها.",
  opsRejected:
    "لم يقبل الخادم الإجراء. حدّث البيانات وراجعها قبل محاولة جديدة؛ تواصل مع الدعم إذا تكرر الرفض.",
  opsPreflightFailed: "تعذر تحميل أحدث البيانات. لم يُرسل الإجراء؛ مسودتك محفوظة في هذه الصفحة.",
  opsStorage:
    "تعذر حفظ أو قراءة سجل أمان المحاولة. لا تكرر الإجراء؛ تحقّق من السماح بتخزين الجلسة ثم راجع النتيجة.",
  opsRecoveryMissing:
    "يوجد سجل محاولة غير قابل للتحقق. الإجراءات متوقفة لتجنب التكرار؛ اطلب مراجعة النتيجة من الدعم قبل المتابعة.",
  opsRefreshFailed:
    "أكد الخادم قبول الإجراء، لكن تعذر التحقق من الحالة المحدثة. لا تعِد الإرسال؛ تحقّق من النتيجة.",
  opsAwaitingRead:
    "أكد الخادم قبول الإجراء، لكن البيانات الحالية لا تؤكد النتيجة المطلوبة بعد. الإرسال مقفل؛ استخدم التحقق من النتيجة.",
  opsUncertain: "تعذر التأكد من نتيجة العملية. لن نعيد الإرسال تلقائيًا؛ تحقّق من النتيجة أولًا.",
  opsObserved:
    "تظهر أحدث بيانات الخادم الحالة المطلوبة، لكن لا يمكن نسبتها إلى المحاولة السابقة. لم نعد إرسال الإجراء.",
  opsDifferentDriver:
    "تظهر أحدث البيانات سائقًا مختلفًا. لم نزل السائق الجديد؛ راجع الطلب قبل أي إجراء آخر.",
  opsRetryReview:
    "تم التحقق من أحدث البيانات، ولم تتأكد نتيجة المحاولة السابقة. يلزم مراجعة جديدة وتأكيد جديد قبل إعادة المحاولة.",
  opsInitialHeld:
    "لا يمكن بدء تعيين جديد أثناء إجراء للسائق أو بعد محاولة إزالته في هذه الجلسة. تحقّق من النتيجة؛ تغيير السائق يحتاج مسار إعادة تعيين معتمدًا.",

  title: "عمليات السطحات",
  eyebrow: "مركز العمليات",
  subtitle: "راجع الطلبات ومسار الرحلة والدفع والسائق، ثم افتح الطلب للعمل على تفاصيله.",
  navigation: "التنقل الإداري",
  closeNavigation: "إغلاق التنقل",
  language: "English",
  queue: "قائمة الطلبات",
  queueHint: "الأحدث أولًا · جميع طلبات السطحات",
  total: "{{count}} طلب إجمالًا",
  refresh: "تحديث البيانات",
  refreshing: "جارٍ التحديث…",
  updated: "آخر تحديث {{time}}",
  notUpdated: "لم تُحدّث البيانات بعد",
  back: "العودة للقائمة",
  generalOrders: "جميع الطلبات",
  open: "فتح الطلب {{number}}",
  selected: "الطلب المحدد",
  emptyTitle: "لا توجد طلبات سطحات",
  emptyHint: "ستظهر الطلبات الواردة هنا عند تحديث القائمة.",
  emptyPage: "لا توجد طلبات في هذه الصفحة",
  firstPage: "العودة للصفحة الأولى",
  loading: "جارٍ تحميل الطلبات",
  loadingDetail: "جارٍ تحميل تفاصيل الطلب",
  errorTitle: "تعذر تحميل البيانات",
  errorHint:
    "تعذر التحقق من البيانات. تحقق من الاتصال ثم أعد المحاولة؛ لا تعتمد على معلومات غير محدثة لاتخاذ إجراء.",
  stale: "تعذر التحديث. هذه آخر بيانات محملة وقد تكون تغيرت.",
  retry: "إعادة المحاولة",
  invalidOrder: "تعذر عرض طلب السطحة",
  pagination: "صفحات طلبات السطحات",
  pageOf: "صفحة {{page}} من {{total}}",
  previous: "السابق",
  next: "التالي",
  review: "بحاجة إلى مراجعة",
  checkDetails: "تحقق من بيانات الرحلة",
  nextStep: "الخطوة التالية",
  reviewHint: "راجع بيانات الرحلة، ثم أعدّ عرض السعر واختر سائقًا للطلب الجديد المؤهل.",
  checkHint: "توجد بيانات ناقصة أو نقاط تحتاج تحققًا. راجع التفاصيل وتواصل مع العميل عند الحاجة.",
  orderStatus: "حالة الطلب",
  statusUnknown: "حالة غير معروفة",
  code: "رمز {{code}}",
  statusNote: "هذه حالة الطلب المسجلة؛ لا تؤكد موقع السائق أو تقدّم الرحلة.",
  payment: "حالة الدفع",
  paymentUnknown: "غير مؤكد",
  paymentHint:
    "حالة الدفع غير مؤكدة من البيانات الحالية. لا تعتبر الطلب مدفوعًا؛ تحقّق عبر القناة المعتمدة.",
  paymentMethod: "طريقة الدفع",
  methodUnknown: "غير مؤكدة",
  assignment: "سائق السطحة",
  assigned: "تم تعيين سائق",
  unassigned: "لم يتم تعيين سائق",
  unknown: "بيانات السائق غير مؤكدة",
  route: "المسار المسجل",
  origin: "عنوان الانطلاق المسجل",
  originHint: "يُعرض عنوان الطلب كما ورد. يلزم تأكيد أنه موقع التقاط المركبة.",
  destination: "الوجهة",
  locationMissing: "الإحداثيات غير متوفرة",
  locationInvalid: "إحداثيات غير صالحة",
  locationSuspect: "إحداثيات قد تكون افتراضية",
  locationUnverified: "إحداثيات مسجلة · الموقع غير متحقق",
  sameLocations: "نقطتا الانطلاق والوجهة متطابقتان؛ تحقق من المسار مع العميل.",
  customer: "العميل",
  customerMissing: "اسم العميل غير متوفر",
  phone: "رقم التواصل",
  call: "اتصال بالعميل",
  vehicle: "مركبة العميل",
  plate: "لوحة المركبة",
  vehicleMissing: "بيانات المركبة غير متوفرة",
  driver: "سائق السطحة",
  driverMissing: "اسم السائق غير متوفر",
  driverHint: "تعيين السائق لا يعني أنه متاح للرحلة.",
  availability: "توفر السائق غير معروف",
  finances: "القيم المالية المسجلة",
  subtotal: "المجموع الفرعي",
  discount: "الخصم",
  totalPrice: "الإجمالي",
  moneyHint: "مبالغ مسجلة دون عملة مؤكدة. لا تثبت تحصيل الدفع.",
  duration: "المدة التقديرية المسجلة",
  durationHint: "تقدير مسجل، وليس وقت وصول حيًا.",
  notes: "الملاحظات والمرفقات",
  noNotes: "لا توجد ملاحظات مسجلة",
  noAttachments: "لا توجد مرفقات مسجلة",
  attachmentsUnknown: "بيانات المرفقات غير متوفرة",
  attachment: "مرفق {{number}}",
  unavailableLink: "رابط غير متاح",
  openAttachment: "فتح المرفق في نافذة جديدة",
  missing: "غير متوفر",
  identity: "المعرّف",
  created: "وقت إنشاء الطلب",
  contactMissing: "رقم التواصل غير متوفر",
  originShort: "الانطلاق",
  dialogTitle: "مساحة الطلب",
  dialogHint: "تفاصيل الرحلة ومراجعة إجراءات التشغيل",
  discardPrompt: "ستفقد المسودة الموجودة في هذه الصفحة عند المغادرة. هل تريد حذفها والعودة؟",
  keepDraft: "البقاء في الطلب",
  discardDraft: "حذف المسودة والمغادرة",
  dispatchTitle: "السائق وعرض السعر",
  preparePermission: "إعداد العرض وإرساله يتطلبان صلاحية إدارة الطلبات وعرض المستخدمين.",
  prepareHint: "اختر سائقًا وأدخل التكلفة والمدة، ثم راجع العرض وأكّد إرساله للعميل.",
  prepare: "إعداد السائق وعرض السعر",
  driverStateUnknown: "لا يمكن التأكد من وجود سائق معين. حدّث بيانات الطلب قبل إعداد العرض.",
  localOnly: "مسودة لم تُرسل بعد. لن يتغير الطلب إلا بعد تأكيد الإرسال.",
  chooseDriver: "اختيار سائق السطحة",
  driverChoiceHint: "تظهر حسابات سائقي السطحات. الحساب النشط لا يعني أن السائق متاح أو متصل.",
  proposedDriver: "السائق المقترح",
  loadingDrivers: "جارٍ تحميل حسابات السائقين…",
  driverLoadError: "تعذر التحقق من قائمة السائقين. أعد تحميلها.",
  activeAccount: "حساب نشط",
  inactiveAccount: "حساب غير نشط",
  currentDriver: "السائق الحالي",
  noDrivers: "لا توجد حسابات سائقين في هذه الصفحة. حدّث القائمة أو انتقل إلى صفحة أخرى إن وجدت.",
  driverPages: "صفحات حسابات السائقين",
  driverRequired: "اختر سائق سطحة بحساب نشط، ثم راجع العرض.",
  proposedCost: "تكلفة الرحلة",
  costHelp:
    "الحد الأدنى 0.01. أدخل المبلغ بوحدة التسعير المعتمدة؛ العملة غير مؤكدة في البيانات الحالية.",
  costInvalid: "استخدم الأرقام 0–9 والنقطة العشرية دون فواصل أو رموز.",
  proposedDuration: "المدة التقديرية",
  durationExample: "مثلًا: 30 دقيقة",
  reviewDraft: "مراجعة العرض",
  reviewingDraft: "جارٍ التحقق من أحدث البيانات…",
  editDraft: "تعديل العرض",
  requestChanged: "تغيّرت بيانات الطلب منذ المراجعة. حدّثها، ثم راجع العرض وأكّد إرساله مجددًا.",
  driverChanged:
    "تغيّرت بيانات السائق أو تعذر اعتمادها. حدّث القائمة واختر سائقًا مؤهلًا ثم راجع العرض.",
  reviewFailed: "تعذر التحقق من أحدث بيانات الطلب والسائق. لم يُرسل تعديل جديد وبقيت المسودة.",
  reviewNeedsFresh: "حدّث بيانات الطلب بنجاح قبل مراجعة العرض. لم تتغير مسودتك.",
  assignDriver: "تعيين السائق وإرسال العرض",
  reassignDriver: "تغيير سائق السطحة",
  unassignDriver: "إزالة السائق من الطلب",
  initialOnly: "تعيين سائق لطلب جديد",
  initialReady: "يمكن إعداد عرض لطلب بانتظار المعالجة دون سائق. إعادة تعيين سائق بديل غير متاحة.",
  initialNeedsUnassigned:
    "يوجد سائق معين لهذا الطلب. إعادة تعيين سائق بديل غير متاحة؛ إزالة السائق إجراء مستقل أدناه.",
  initialNeedsWaiting:
    "حالة الطلب الحالية لا تسمح بتعيين سائق لأول مرة. التعيين متاح فقط للطلبات بانتظار المعالجة.",
  initialPaymentBlocked:
    "بيانات الدفع لهذا الطلب لا تسمح بتأكيد أهليته لعرض أولي. لم يتم تغيير أي مبلغ.",
  confirmInitial: "تأكيد السائق وعرض السعر",
  confirmInitialHint:
    "تأكيد الإرسال يعيّن السائق ويرسل عرض السعر. ينتظر الطلب بعدها دفع العميل عبر تطبيقه؛ إرسال العرض لا يعني تحصيل الدفع.",
  paymentPending: "بانتظار دفع العميل",
  pendingCustomerHint: "عرض السعر بانتظار دفع العميل عبر تطبيقه. لا يوجد إجراء لتحصيل الدفع هنا.",
  assignmentChecking: "جارٍ التحقق من أحدث بيانات الطلب والسائق…",
  assignmentSending: "جارٍ إرسال عرض السعر…",
  assignmentSuccess: "تم تعيين سائق السطحة وإرسال عرض السعر بنجاح.",
  sentQuote: "تكلفة العرض المرسل: {{cost}} · المدة: {{duration}}",
  assignmentAwaitingRead:
    "أكد الخادم قبول العرض، لكن بيانات السائق لم تتطابق بعد. الإرسال مقفل؛ تحقّق من بيانات الطلب دون إعادة الإرسال.",
  assignmentUncertain:
    "نتيجة الإرسال غير مؤكدة. الإرسال مقفل حتى التحقق من أحدث بيانات الطلب؛ لا تعِد المحاولة قبل ذلك.",
  assignmentRetryReview:
    "تظهر أحدث البيانات طلبًا مؤهلًا دون سائق. راجع العرض وأكّده مجددًا للمحاولة. نجاح الإرسال السابق غير مؤكد.",
  assignmentObserved:
    "تظهر أحدث البيانات سائقًا معينًا. لن نكرر الإرسال؛ تحقق من التفاصيل. لا يمكن نسب هذا التغيير إلى المحاولة السابقة.",
  assignmentForbidden: "ليست لديك الصلاحيات اللازمة لهذا الإجراء. تواصل مع مسؤول الصلاحيات.",
  assignmentConflict:
    "رفض الخادم الإجراء بسبب تعارض مع البيانات الحالية. حدّث الطلب والسائقين، ثم راجع العرض قبل المحاولة مجددًا.",
  assignmentMissing:
    "الطلب أو السائق المشار إليه لم يعد متاحًا. حدّث الطلب وقائمة السائقين قبل مراجعة العرض.",
  assignmentValidation:
    "لم يقبل الخادم بيانات العرض. تحقق من السائق والتكلفة والمدة، ثم راجع العرض مجددًا.",
  assignmentStorage:
    "تعذر حفظ علامة أمان المحاولة في هذه الجلسة. اسمح بتخزين الجلسة ثم تحقّق من الطلب قبل الإرسال.",
  assignmentStay: "الإرسال أو التحقق جارٍ. انتظر اكتمال العملية قبل مغادرة الطلب.",
  checkOutcome: "التحقق من نتيجة الطلب",
  assignmentBusyPrevious:
    "سبق أن رفض الخادم السائق في المحاولة السابقة لأنه مشغول. راجع العرض مع السائق الجديد قبل الإرسال.",
  assignmentRejectedTitle: "تعذر تعيين سائق السطحة",
  assignmentDriverBusy:
    "السائق المحدد مشغول بطلب آخر حاليًا. اختر سائقًا آخر، ثم راجع العرض وأكد إرساله.",
  assignmentAuthentication:
    "تعذر التحقق من جلسة تسجيل الدخول. احتفظ ببيانات العرض قبل إعادة تسجيل الدخول، ثم حدّث الطلب.",
  assignmentInvalidRequest:
    "رفض الخادم صيغة الطلب. راجع السائق والتكلفة والمدة. إذا استمر الرفض، تواصل مع الدعم مع رقم الطلب.",
  assignmentRejected:
    "لم يقبل الخادم التعيين ولم يقدّم سببًا يمكن عرضه بأمان. حدّث البيانات وراجع العرض؛ تواصل مع الدعم إذا تكرر الرفض.",
  assignmentRefreshFailed:
    "أكد الخادم قبول العرض، لكن تعذر تحديث تفاصيل الطلب. لا تعِد الإرسال؛ استخدم التحقق من النتيجة لتحديث العرض.",
  draftPreserved:
    "احتُفظ بالتكلفة والمدة في هذه الصفحة. تعديل السائق أو العرض يتطلب مراجعة جديدة وتأكيدًا جديدًا.",
  quoteChanged: "تغيّرت بيانات العرض بعد المراجعة. راجع القيم الجديدة ثم أكّد الإرسال مجددًا.",
  reviewRequired: "راجع العرض بعد أي تعديل؛ لن يُرسل شيء دون تأكيد جديد.",
  changeDriver: "اختيار سائق آخر",
  driverInactive: "حساب السائق غير نشط. اختر سائقًا آخر بحساب نشط ثم راجع العرض.",
  driverWrongRole: "الحساب المحدد ليس حساب سائق سطحة. حدّث القائمة واختر سائقًا آخر.",
  driverReadFailed:
    "تعذر التحقق من بيانات السائق. لم يُرسل العرض؛ حدّث القائمة ثم راجع العرض مجددًا.",
  costRequired: "أدخل تكلفة الرحلة.",
  costMinimum: "أقل تكلفة مسموحة هي 0.01.",
  costPrecision:
    "لا يمكن إرسال هذا المبلغ بدقة دون تغيير قيمته. استخدم مبلغًا يمكن تمثيله بدقة أو راجع الدعم.",
  durationRequired: "أدخل المدة التقديرية للرحلة.",
  durationTooLong: "اختصر المدة التقديرية إلى 100 حرف كحد أقصى.",
  submissionTimeout: "انتهت مهلة الاستجابة بعد محاولة الإرسال.",
  submissionNetwork: "انقطع الاتصال أثناء محاولة الإرسال.",
  submissionServerError: "تعذر الحصول على نتيجة موثوقة بسبب خطأ في الخادم.",
  submissionMalformed: "لم يحتوِ رد الخادم على تأكيد صالح لنتيجة الإرسال.",
  submissionUnknown: "لم تصل نتيجة موثوقة لمحاولة الإرسال.",
  readAuthentication:
    "تعذر تحميل البيانات بسبب جلسة تسجيل الدخول. احفظ مسودتك إن وجدت قبل تسجيل الدخول مجددًا.",
  readForbidden: "لا تملك صلاحية عرض هذه البيانات. تواصل مع مسؤول الصلاحيات.",
  readMissing: "البيانات المطلوبة غير متاحة. عُد للقائمة وحدّثها.",
  orderWrongType: "هذا الطلب ليس طلب سطحة؛ لا يمكن تشغيله من هذا القسم. عُد للقائمة.",
  orderIdentityInvalid: "لم تصل هوية طلب صالحة يمكن التحقق منها. عُد للقائمة وحدّث البيانات.",
  invalidLink: "رابط الطلب لا يحتوي معرّفًا صالحًا. عُد للقائمة وافتح الطلب من هناك.",
};
export const towTruckEn: typeof towTruckAr = {
  opsRejectedRefresh:
    "Data could not be refreshed after rejection. Previously loaded details remain; refresh them before reviewing another attempt.",
  opsTitle: "Driver management",
  opsOrderAction: "This request’s assigned driver",
  opsRemoveOnly:
    "Removing a driver affects this request only. It does not deactivate their account, cancel the order or refund payment.",
  opsAccountTitle: "Driver account status",
  opsAccountScope:
    "Activation and deactivation affect the driver’s account access. They do not automatically change order assignment or establish availability.",
  opsManageAccounts: "Manage a tow truck driver account",
  opsOrderPermission: "Removing a driver requires order management permission.",
  opsViewPermission: "Viewing driver accounts requires user viewing permission.",
  opsAccountPermission:
    "You can view this account but do not have permission to change its status.",
  opsOtherOperation:
    "An assignment is in progress or its previous result remains unresolved. Check its outcome before another change.",
  opsRemoveTitle: "Remove the driver from this request?",
  opsRemovePaidTitle: "Remove the driver from a paid request?",
  opsRemoveHint:
    "Only driver removal will be requested. The order will not be cancelled, refunded or automatically repriced.",
  opsRemovePaidHint:
    "This request is paid. Removing its driver does not cancel the request or refund payment. Review the operational consequences before confirming; the server may reject the action.",
  opsRemoveUnknownHint:
    "Payment status is unconfirmed and this request may be paid. Driver removal does not cancel or refund it. Verify the financial and operational implications before continuing.",
  opsRiskConfirm:
    "I have reviewed the payment state and understand that driver removal does not cancel or refund the request.",
  opsRiskRequired: "Review and acknowledge the payment warning before requesting removal.",
  opsPaid: "Paid",
  opsConfirm_remove: "Confirm driver removal",
  opsConfirm_activate: "Confirm account activation",
  opsConfirm_deactivate: "Confirm account deactivation",
  opsActivate: "Review account activation",
  opsDeactivate: "Review account deactivation",
  opsActivateHint:
    "Activation will be requested for this account. It does not mean the driver is currently available or assign them to an order.",
  opsDeactivateHint:
    "Deactivation will be requested with the reason below. It does not remove the driver from orders or cancel them; the server may reject deactivation because of existing commitments.",
  opsReason: "Reason for account deactivation",
  opsReasonHelp: "Enter a clear reason, 1–500 characters. Avoid unnecessary sensitive information.",
  opsReasonRequired: "Enter a reason for deactivating the account.",
  opsReasonLong: "The reason must not exceed 500 characters.",
  opsReasonInvalid: "Enter a valid reason, 1–500 characters.",
  opsReasonDraft:
    "The reason is preserved on this page. Clear the reason field to select another account.",
  opsActive: "Account active",
  opsInactive: "Account inactive",
  opsAvailability:
    "Current availability unknown. Account status does not establish whether a driver is online or available.",
  opsAssignedAccountHint:
    "This driver is assigned to the request. Changing their account status is separate from removing them from it.",
  opsLoadingAccount: "Checking the driver account…",
  opsAccountReadFailed:
    "The driver account could not be verified. Refresh it before reviewing the action.",
  opsReviewRemoval: "Review driver removal",
  opsEditReview: "Back to review",
  opsClose: "Close",
  opsCancel: "Cancel",
  opsChecking: "Checking the latest data…",
  opsSending: "Submitting action…",
  opsSuccess_remove:
    "The driver was removed and the request refreshed. No cancellation, refund or price-change request was sent.",
  opsSuccess_activate: "The driver account was activated and its state confirmed with the server.",
  opsSuccess_deactivate:
    "The driver account was deactivated and its state confirmed with the server.",
  opsContext: "Request #{{order}} · Driver account #{{driver}}",
  opsFinancialWarning:
    "Review the current financial values: they changed since review or could not be compared. No financial adjustment or refund was performed by this interface.",
  opsChanged:
    "The request, driver or payment data changed. No new action was sent; review the data and confirm again.",
  opsAccountChanged:
    "Account details or status changed, or its identity could not be confirmed. No action was sent; refresh and review the account.",
  opsIdentity:
    "A tow truck driver identity and account state could not be confirmed. Refresh the data; an unverified account cannot be changed.",
  opsForbidden:
    "You do not currently have the required permission. The action was not resent; contact your access administrator.",
  opsAuthentication:
    "Your sign-in session could not be verified. Keep a copy of your draft before signing in again, then check the data.",
  opsValidation:
    "The server rejected the action or its data. Review the account, request and any reason before confirming a new attempt.",
  opsMissing:
    "The request or driver account is unavailable. Refresh the data before another action.",
  opsConflict:
    "The server rejected the action because it conflicts with the current state. Existing commitments may apply; refresh and review the data.",
  opsRejected:
    "The server did not accept the action. Refresh and review before another attempt; contact support if rejection persists.",
  opsPreflightFailed:
    "The latest data could not be loaded. No action was sent; your draft is preserved on this page.",
  opsStorage:
    "The attempt safety record could not be saved or read. Do not repeat the action; check session storage access, then verify the result.",
  opsRecoveryMissing:
    "An attempt record cannot be verified. Actions are locked to prevent duplication; ask support to review the outcome before proceeding.",
  opsRefreshFailed:
    "The server acknowledged the action, but the updated state could not be verified. Do not resend; check the outcome.",
  opsAwaitingRead:
    "The server acknowledged the action, but current data does not yet confirm the requested state. Submission is locked; use Check outcome.",
  opsUncertain:
    "The operation outcome is uncertain. We will not automatically resend it; check the outcome first.",
  opsObserved:
    "The latest server data shows the requested state, but it cannot be attributed to the previous attempt. The action was not resent.",
  opsDifferentDriver:
    "The latest data shows a different driver. We did not remove the new driver; review the request before any further action.",
  opsRetryReview:
    "The latest data was checked and the previous outcome is unconfirmed. A new review and confirmation are required before retrying.",
  opsInitialHeld:
    "Initial assignment is unavailable during a driver operation or after a removal attempt in this session. Check the outcome; replacing the driver requires an approved reassignment workflow.",

  title: "Tow truck operations",
  eyebrow: "OPERATIONS CENTER",
  subtitle: "Review each request’s route, payment and driver, then open its dispatch workspace.",
  navigation: "Admin navigation",
  closeNavigation: "Close navigation",
  language: "العربية",
  queue: "Request queue",
  queueHint: "Newest first · All tow truck requests",
  total: "{{count}} requests in total",
  refresh: "Refresh data",
  refreshing: "Refreshing…",
  updated: "Updated {{time}}",
  notUpdated: "Not updated yet",
  back: "Back to queue",
  generalOrders: "All orders",
  open: "Open request {{number}}",
  selected: "Selected request",
  emptyTitle: "No tow truck requests",
  emptyHint: "Incoming requests will appear here when you refresh the queue.",
  emptyPage: "No requests on this page",
  firstPage: "Return to first page",
  loading: "Loading requests",
  loadingDetail: "Loading request details",
  errorTitle: "Unable to load data",
  errorHint:
    "The data could not be verified. Check your connection and retry; do not act on unrefreshed information.",
  stale: "Refresh failed. Showing previously loaded information that may have changed.",
  retry: "Try again",
  invalidOrder: "Unable to show this tow truck request",
  pagination: "Tow truck request pages",
  pageOf: "Page {{page}} of {{total}}",
  previous: "Previous",
  next: "Next",
  review: "Needs review",
  checkDetails: "Check trip details",
  nextStep: "Next step",
  reviewHint:
    "Review the trip, then prepare a quote and select a driver for an eligible new request.",
  checkHint:
    "Some details are missing or locations need verification. Review the request and contact the customer if needed.",
  orderStatus: "Order status",
  statusUnknown: "Unknown status",
  code: "Code {{code}}",
  statusNote:
    "This is the recorded order status; it does not confirm driver location or trip progress.",
  payment: "Payment status",
  paymentUnknown: "Unconfirmed",
  paymentHint:
    "Current data does not confirm payment. Do not treat the request as paid; verify through the established channel.",
  paymentMethod: "Payment method",
  methodUnknown: "Unconfirmed",
  assignment: "Tow truck driver",
  assigned: "Driver assigned",
  unassigned: "No driver assigned",
  unknown: "Driver assignment unknown",
  route: "Recorded route",
  origin: "Recorded origin address",
  originHint: "The order address is shown as received. Confirm it is the vehicle pickup location.",
  destination: "Destination",
  locationMissing: "Coordinates not provided",
  locationInvalid: "Invalid coordinates",
  locationSuspect: "Possible placeholder coordinates",
  locationUnverified: "Recorded coordinates · Location unverified",
  sameLocations:
    "Origin and destination share the same coordinates. Confirm the route with the customer.",
  customer: "Customer",
  customerMissing: "Customer name not provided",
  phone: "Contact number",
  call: "Call customer",
  vehicle: "Customer vehicle",
  plate: "Vehicle plate",
  vehicleMissing: "Vehicle details not provided",
  driver: "Tow truck driver",
  driverMissing: "Driver name not provided",
  driverHint: "An assigned driver is not necessarily available for this trip.",
  availability: "Driver availability unknown",
  finances: "Recorded financial values",
  subtotal: "Subtotal",
  discount: "Discount",
  totalPrice: "Total",
  moneyHint: "Recorded amounts without a confirmed currency. They do not establish payment.",
  duration: "Recorded estimated duration",
  durationHint: "A recorded estimate, not a live arrival time.",
  notes: "Notes & attachments",
  noNotes: "No recorded notes",
  noAttachments: "No recorded attachments",
  attachmentsUnknown: "Attachment information is not available",
  attachment: "Attachment {{number}}",
  unavailableLink: "Link unavailable",
  openAttachment: "Open attachment in a new window",
  missing: "Not provided",
  identity: "ID",
  created: "Request created",
  contactMissing: "Contact number not provided",
  originShort: "Origin",
  dialogTitle: "Request workspace",
  dialogHint: "Trip details and dispatch preparation",
  discardPrompt: "Leaving will discard the draft on this page. Discard it and return?",
  keepDraft: "Stay on this request",
  discardDraft: "Discard and leave",
  dispatchTitle: "Driver & quotation",
  preparePermission:
    "Preparing and sending a quote require order management and user viewing permissions.",
  prepareHint: "Choose a driver, enter cost and duration, then review and confirm the quotation.",
  prepare: "Prepare driver & quotation",
  driverStateUnknown:
    "Driver assignment cannot be confirmed. Refresh the request before preparing a quote.",
  localOnly: "Unsent draft. The order changes only after you confirm submission.",
  chooseDriver: "Choose a tow truck driver",
  driverChoiceHint:
    "Tow truck driver accounts are listed here. An active account does not mean the driver is available or online.",
  proposedDriver: "Proposed driver",
  loadingDrivers: "Loading driver accounts…",
  driverLoadError: "The driver list could not be verified. Reload it.",
  activeAccount: "Active account",
  inactiveAccount: "Inactive account",
  currentDriver: "Current driver",
  noDrivers: "No driver accounts on this page. Refresh the list or use another page if available.",
  driverPages: "Driver account pages",
  driverRequired: "Choose a tow truck driver with an active account, then review the quote.",
  proposedCost: "Trip cost",
  costHelp:
    "Minimum 0.01. Enter the amount in the established pricing unit; current data does not confirm the currency.",
  costInvalid: "Use digits 0–9 and a decimal point, without separators or symbols.",
  proposedDuration: "Estimated duration",
  durationExample: "For example: 30 minutes",
  reviewDraft: "Review quotation",
  reviewingDraft: "Checking the latest data…",
  editDraft: "Edit quotation",
  requestChanged:
    "Order data changed since review. Refresh it, then review the quote and confirm again.",
  driverChanged:
    "Driver information changed or could not be confirmed. Refresh the list, choose an eligible driver and review the quote.",
  reviewFailed:
    "The latest request and driver could not be verified. No new change was sent; your draft is preserved.",
  reviewNeedsFresh:
    "Successfully refresh the request before reviewing the quote. Your draft is unchanged.",
  assignDriver: "Assign driver & send quote",
  reassignDriver: "Change tow truck driver",
  unassignDriver: "Remove driver from request",
  initialOnly: "Assign a driver to a new request",
  initialReady:
    "Prepare a quote for a waiting request with no driver. Reassignment remains unavailable.",
  initialNeedsUnassigned:
    "This request already has an assigned driver. Reassignment remains unavailable; driver removal is a separate action below.",
  initialNeedsWaiting:
    "This order’s current status does not permit initial assignment. Only waiting requests are eligible.",
  initialPaymentBlocked:
    "This payment state cannot be confirmed as eligible for an initial quotation. No amount has been changed.",
  confirmInitial: "Confirm driver & quotation",
  confirmInitialHint:
    "Confirming assigns the driver and submits the quote. The customer then pays in their app; sending a quote does not collect payment.",
  paymentPending: "Awaiting customer payment",
  pendingCustomerHint:
    "The quote is awaiting customer payment in their app. There is no collection action here.",
  assignmentChecking: "Checking the latest request and driver…",
  assignmentSending: "Submitting quotation…",
  assignmentSuccess:
    "The tow truck driver has been assigned and the quotation submitted successfully.",
  sentQuote: "Submitted quotation cost: {{cost}} · Duration: {{duration}}",
  assignmentAwaitingRead:
    "The server acknowledged the quote, but driver details do not match yet. Submission is locked; check the request without sending again.",
  assignmentUncertain:
    "The submission outcome is uncertain. Submission is locked until the latest request is checked; do not retry before that.",
  assignmentRetryReview:
    "The latest data shows an eligible request without a driver. Review and confirm again to retry. The previous submission is not confirmed.",
  assignmentObserved:
    "The latest data shows an assigned driver. We will not send again; check the details. This change cannot be attributed to the previous attempt.",
  assignmentForbidden:
    "You do not have permission for this action. Contact your access administrator.",
  assignmentConflict:
    "The server rejected the action because it conflicts with current data. Refresh the request and drivers, then review the quote before trying again.",
  assignmentMissing:
    "The request or referenced driver is no longer available. Refresh the request and driver list before reviewing the quote.",
  assignmentValidation:
    "The server did not accept the quotation details. Check the driver, cost and duration, then review again.",
  assignmentStorage:
    "The attempt safety marker could not be saved in this session. Allow session storage, then check the request before submitting.",
  assignmentStay: "Submission or verification is in progress. Wait before leaving this request.",
  checkOutcome: "Check request outcome",
  assignmentBusyPrevious:
    "The server rejected the driver in the previous attempt as busy. Review the quote with the newly selected driver before sending.",
  assignmentRejectedTitle: "Unable to assign tow truck driver",
  assignmentDriverBusy:
    "The selected driver is busy with another order. Choose another driver, review the quote, and confirm submission again.",
  assignmentAuthentication:
    "Your sign-in session could not be verified. Keep a copy of the quote before signing in again, then refresh the request.",
  assignmentInvalidRequest:
    "The server rejected the request format. Review the driver, cost and duration. If it persists, contact support with the order number.",
  assignmentRejected:
    "The server rejected the assignment without a reason we can safely display. Refresh the data and review the quote; contact support if rejection persists.",
  assignmentRefreshFailed:
    "The server acknowledged the quote, but request details could not be refreshed. Do not resend; use Check request outcome to refresh the view.",
  draftPreserved:
    "Cost and duration are preserved on this page. Changing the driver or quote requires a new review and confirmation.",
  quoteChanged:
    "Quotation details changed after review. Review the new values, then confirm submission again.",
  reviewRequired: "Review the quote after any edit; nothing is sent without a new confirmation.",
  changeDriver: "Choose another driver",
  driverInactive:
    "This driver’s account is inactive. Choose another driver with an active account and review the quote.",
  driverWrongRole:
    "The selected account is not a tow truck driver. Refresh the list and choose another driver.",
  driverReadFailed:
    "Driver details could not be verified. The quote was not sent; refresh the list and review again.",
  costRequired: "Enter the trip cost.",
  costMinimum: "The minimum cost is 0.01.",
  costPrecision:
    "This amount cannot be sent accurately without changing its value. Use an exactly representable amount or contact support.",
  durationRequired: "Enter the estimated trip duration.",
  durationTooLong: "Keep the estimated duration to 100 characters or fewer.",
  submissionTimeout: "The response timed out after submission was attempted.",
  submissionNetwork: "The connection failed during the submission attempt.",
  submissionServerError: "A server error prevented a reliable submission result.",
  submissionMalformed: "The server response did not contain a valid submission acknowledgment.",
  submissionUnknown: "A reliable result was not received for the submission attempt.",
  readAuthentication:
    "Data could not be loaded because of your sign-in session. Keep a copy of any draft before signing in again.",
  readForbidden: "You do not have permission to view this data. Contact your access administrator.",
  readMissing: "The requested data is unavailable. Return to the queue and refresh.",
  orderWrongType:
    "This is not a tow truck order and cannot be dispatched here. Return to the queue.",
  orderIdentityInvalid:
    "A valid request identity could not be verified. Return to the queue and refresh.",
  invalidLink:
    "The request link does not contain a valid ID. Return to the queue and open the request there.",
};
