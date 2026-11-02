export const towTruckAr = {
  opsMutationConflict:
    "هذا الإجراء غير متاح بسبب حالة الطلب أو عملية أخرى قيد التنفيذ أو التحقق. تحقّق من النتائج قبل إجراء تغيير جديد.",
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
  serverTotal: "إجمالي الطلبات بالخادم: {{count}}",
  refresh: "تحديث البيانات",
  refreshing: "جارٍ التحديث…",
  updated: "آخر تحديث {{time}}",
  notUpdated: "لم تُحدّث البيانات بعد",
  syncStaleBanner:
    "تعذر تحديث البيانات من الخادم مؤخراً. البيانات المعروضة أدناه هي آخر نسخة محفوظة.",
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
  colOrderTime: "الطلب والتوقيت",
  colRoute: "المسار المسجل",
  colCustomer: "العميل والتواصل",
  colVehicle: "المركبة واللوحة",
  colOrderStatus: "الحالة التشغيلية",
  colPaymentStatus: "حالة الدفع",
  colDriver: "سائق السطحة",
  colAction: "الإجراء",
  colCorridor: "المسار بين المدن",
  colAmountPayment: "المبلغ وحالة الدفع",
  roadIdLabel: "المسار #{{id}}",
  corridorMissing: "مسار غير محدد في الاستجابة",
  recordedAmount: "المبلغ المسجل",
  searchTrackPlaceholder: "البحث برقم التتبع أو الطلب (بحث خادومي)...",
  searchButton: "بحث",
  clearSearch: "مسح البحث",
  searching: "جارٍ البحث...",
  searchActiveNotice: "نتائج البحث برقم التتبع:",
  searchTotal: "{{count}} نتيجة بحث مطابقة",
  filterAll: "الكل",
  filterUnassigned: "بحاجة لإسناد",
  filterAssigned: "مسندة",
  filterPaid: "مدفوعة",
  filterAttention: "تتطلب مراجعة",
  localFilterScope:
    "التصفية السريعة تنطبق على الطلبات الـ ({{count}}) المحملة في هذه الصفحة. للبحث الشامل في سجلات الخادم، استخدم حقل البحث برقم التتبع أعلاه.",
  noFilterResults: "لا توجد طلبات تطابق التصفية المحددة في هذه الصفحة.",
  resetFilter: "عرض كافة طلبات الصفحة",
  noSearchResults: "لا توجد طلبات تطابق رقم التتبع المدخل.",
  detailsAction: "تفاصيل الطلب",
  openDetails: "فتح التفاصيل",
  plateMissing: "بدون لوحة",
  routeAlertTitle: "تنبيه المسار",
  routeSame: "نقطتا الانطلاق والوجهة متطابقتان",
  routeMissingCoords: "الإحداثيات الجغرافية غير مكتملة",
  contactCustomer: "اتصال بالعميل",
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
  paymentPaidHint: "تم تأكيد دفع هذا الطلب من الخادم.",
  paymentFailedHint: "فشلت عملية الدفع لهذا الطلب.",
  paymentRefundedHint: "تم استرداد مبلغ هذا الطلب.",
  paymentMethod: "طريقة الدفع",
  methodUnknown: "طريقة الدفع غير محددة",
  paymentMethodUnspecified: "طريقة الدفع غير محددة",
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
  locationUnverified: "إحداثيات مسجلة من العميل",
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
  preparePermission: "إعداد العرض وإرساله يتطلبان صلاحية إدارة الطلبات.",
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
  noActiveDrivers:
    "جميع حسابات السائقين في هذه الصفحة غير نشطة حاليًا. حدّث القائمة أو انتقل لصفحة أخرى.",
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
  quickPreviewTitle: "معاينة سريعة للطلب",
  quickPreviewSubtitle: "ملخص سريع لبيانات الرحلة وحالتها التشغيلية",
  openFullWorkspace: "فتح مساحة العمل الكاملة",
  backToQueue: "العودة إلى قائمة الطلبات",
  workspaceTitle: "مساحة عمل الطلب",
  workspaceSubtitle: "إدارة تفاصيل الطلب والتسعير وعمليات السائقين",
  operationalSummary: "الملخص التشغيلي",
  verifiedStage: "المرحلة الحالية المؤكدة",
  viewOnGoogleMaps: "عرض المسار على الخريطة",
  viewLocationOnMap: "عرض الموقع على الخريطة",
  routeDetails: "مسار الرحلة والمواقع",
  customerAndVehicle: "العميل والمركبة",
  orderFinances: "البيانات المالية والتسعير",
  driverAndDispatch: "إسناد السائق والتشغيل",
  additionalInfo: "الملاحظات والمرفقات الإضافية",
  noOrderSelected: "لم يتم تحديد أي طلب",
  orderNotFound: "الطلب غير موجود",
  orderNotFoundDesc: "تعذر العثور على بيانات هذا الطلب أو أن معرّف الطلب غير صالح.",
  quickPreview: "معاينة سريعة",
  closePreview: "إغلاق المعاينة",
  pickupCoordinates: "إحداثيات الانطلاق",
  destinationCoordinates: "إحداثيات الوجهة",
  currencySar: "ر.س",
  locationQuality: "دقة الموقع",
  nextAction: "الإجراء التشغيلي التالي",
  allOrders: "جميع الطلبات",
  queueCaption: "عرض {{batch}} من أصل {{total}} طلبًا بالخادم · الأحدث أولًا",
  syncing: "جارٍ المزامنة…",
  refreshQueue: "تحديث قائمة الطلبات",
  orderNumber: "رقم الطلب",
  attachments: "المرفقات",
  contact: "وسيلة التواصل",
  cancelReviewAgain: "أغلق النافذة وراجع بيانات الطلب قبل بدء مراجعة إلغاء جديدة.",
  cancelAcknowledged: "أقرّ الخادم طلب الإلغاء، لكن لم تُؤكّد الحالة النهائية بعد.",
  cancelReadFailed: "تعذر التحقق من الحالة الحالية. تبقى إعادة الإلغاء محظورة.",
  cancelStorage:
    "تعذر التحقق من سجل المحاولة بأمان. لا تعِد الإلغاء؛ تحقّق من النتيجة أو تواصل مع الدعم.",
  cancelReviewFailed:
    "تعذرت قراءة بيانات موثوقة للطلب. لم يُرسل الإلغاء؛ أغلق النافذة وأعد المراجعة.",
  cancelReviewChanged:
    "تغيّرت بيانات الطلب. لم يُرسل الإلغاء؛ أغلق النافذة وراجع البيانات المحدّثة قبل التأكيد مجددًا.",
  cancelOperationConflict:
    "تغيّرت الصلاحية أو توجد عملية أخرى قيد التنفيذ أو التحقق. لم يُرسل الإلغاء.",
  cancelOrder: "إلغاء الطلب",
  cancelOrderTitle: "إلغاء طلب السطحة",
  cancelOrderDescription:
    "أنت على وشك إلغاء طلب السطحة رقم {{orderNumber}}. يرجى مراجعة التنبيهات التشغيلية بعناية.",
  operationalWarning: "تنبيه تشغيلي مهم",
  cancelOrderScopeNotice: "هذا الإجراء يلغي الطلب بالكامل، وليس مجرد إزالة السائق المعيّن.",
  cancelOrderTripNotice: "تحقّق من حالة الرحلة المرتبطة بشكل مستقل؛ لا يؤكد هذا الإجراء نتيجتها.",
  cancelOrderIrreversibleNotice: "لا تفترض إمكانية التراجع عن هذا الإجراء بعد تأكيده.",
  cancelClose: "تراجع وإغلاق",
  close: "إغلاق",
  confirmCancelOrder: "تأكيد إلغاء الطلب",
  cancellingOrder: "جارٍ إلغاء الطلب…",
  cancelSuccess: "تظهر أحدث قراءة أن الطلب ملغى.",
  cancelSuccessHint: "هذه ملاحظة لحالة الطلب، وليست إثباتًا أن هذه المحاولة هي التي ألغته.",
  cancelBlockedPaid: "لا يمكن إلغاء الطلب بعد سداد قيمته.",
  cancelConflictRefreshed:
    "رفض الخادم الإلغاء. أغلق النافذة وراجع بيانات الطلب قبل بدء مراجعة جديدة.",
  cancelBlockedAlreadyCancelled: "هذا الطلب ملغي بالفعل ولا يمكن إلغاؤه مجددًا.",
  cancelBlockedUnknownPayment:
    "بيانات الدفع غير مؤكدة؛ لا يمكن تحديد أهلية الإلغاء حتى التحقق من السداد.",
  cancelNotFound: "الطلب غير متاح أو لا تملك صلاحية إلغائه.",
  cancelForbidden: "ليس لديك صلاحية لإلغاء هذا الطلب.",
  cancelValidation: "تعذر قبول طلب الإلغاء بسبب بيانات غير صالحة.",
  cancelUncertain: "لم تتأكد نتيجة إلغاء الطلب. تحقّق من النتيجة قبل أي محاولة أخرى.",
  cancelUncertainHint:
    "إغلاق النافذة لا يلغي المحاولة. إذا لم تظهر حالة «ملغى»، تبقى إعادة الإرسال محظورة؛ اطلب من الدعم التحقق من المحاولة على الخادم باستخدام رقم الطلب.",
  cancelReconcile: "التحقق من نتيجة الإلغاء",
  cancelChecking: "جارٍ التحقق من حالة الطلب…",
  orderCancelledHint: "تم إلغاء هذا الطلب؛ لا يمكن تنفيذ أي إجراءات تشغيلية أو تعيين سائق له.",
  reassignWorkflowNotice:
    "الطلب لديه سائق مسند حالياً. لإسناد سائق بديل، قم أولاً بإلغاء تعيين السائق الحالي من قسم «عمليات السائق» أعلاه، ثم أعد إسناد السائق المطلوب.",
  goToUnassign: "الانتقال إلى إلغاء تعيين السائق",
  driverReplacementReady:
    "تم إلغاء تعيين السائق السابق لهذا الطلب بنجاح. يمكنك الآن اختيار سائق بديل وتحديد التكلفة والمدة لإرسال العرض.",
  cancelUnavailableTitle: "إلغاء الطلب غير متاح",
  serviceIntraCity: "سطحة داخل المدينة",
  serviceInterCity: "سطحة بين المدن",
  serviceUnknown: "نوع خدمة غير محدد",
  intercityRoute: "مسار بين المدن",
  intercityReceiver: "بيانات المستلم",
  name: "الاسم",
  intercityFixedPriceNotice: "تسعير المسار معتمد مسبقاً لهذا الطلب (بين المدن) بمبلغ ثابت",
  intercityAgreedPriceNotice:
    "طلب سطحة بين المدن: التكلفة محددة مسبقاً ومعتمدة بناءً على مسار الطلب، ولا يمكن تعديلها يدوياً.",
  intercityCostSummaryDesc: "تكلفة مسار بين المدن معتمدة مسبقاً للطلب",
  durationEstimateLabel: "المدة المتوقعة (تقدير إداري)",
  durationEstimateHint: "تقدير إداري للمدة بالساعات أو الأيام للرحلة بين المدن (مطلوب من الخادم)",
  adminDurationSummaryDesc: "تقدير إداري مطلوب للإسناد",
  assignmentPaidInterCityBlocked:
    "إسناد السائق للطلبات المدفوعة بين المدن مقفل احترازياً بانتظار تأكيد سلوك الخادم المالي.",
  assignmentPaidInterCityBlockedDetail:
    "الطلب مسدد بالكامل؛ إسناد السائق للطلبات المدفوعة بين المدن مقفل احترازياً لحماية السجلات المالية المعتمدة ومنع تعديل التكلفة.",
  intercityFixedPriceNoticeTitle: "تسعير مسار محدد مسبقاً (بين المدن)",
  intercityFixedPriceNoticeDesc:
    "السعر الإجمالي المعروض معتمد في بيانات الطلب وفق تسعيرة المسار المحددة مسبقاً.",
  intercityRouteDetailsMissing: "بيانات المسار غير متوفرة في استجابة الطلب الحالية",
  intercityRoutesAdmin: "مسارات بين المدن",
  serviceTypeNavLabel: "نوع الخدمة",
  filterAllServices: "جميع طلبات السطحة",
  serviceTypeFilterNoticeTitle: "تصفية الخدمة ({{service}})",
  serviceTypeFilterNoticeDesc: "تصفية مخصصة لعرض طلبات الخدمة المحددة مباشرة من سجلات النظام.",
  noServiceFilterResults: "لا توجد طلبات مطابقة لنوع الخدمة في الخادم",
  serviceBatchScopeNotice: "يتم عرض {{count}} طلباً مسجلاً في النظام.",
  receiver: "بيانات المستلم (بين المدن)",
  receiverMissing: "لا توجد بيانات مستلم مسجلة",
  operationsNavLabel: "التنقل بين مساحات عمليات السطحات",
  navAllOperations: "جميع عمليات السطحات",
  navAllDesc: "متابعة شاملة لكافة طلبات السطحات الحضرية وبين المدن",
  navAllBadge: "شامل",
  navIntraCity: "عمليات داخل المدن",
  navIntraCityDesc: "إدارة طلبات النقل والإنقاذ المحلي ضمن نطاق المدينة",
  navIntraCityBadge: "داخل المدن",
  navInterCity: "عمليات بين المدن",
  navInterCityDesc: "توجيه وجدولة رحلات السطحات عبر مسارات الطرق السريعة",
  navInterCityBadge: "بين المدن",
  activeWorkspaceIndicator: "المساحة النشطة",
  eyebrowAll: "مركز عمليات السطحات · جميع العمليات",
  eyebrowIntraCity: "مركز عمليات السطحات · داخل المدن",
  eyebrowInterCity: "مركز عمليات السطحات · بين المدن",
  subtitleAll: "لوحة تحكم تشغيلية موحدة لمراقبة وتوجيه كافة طلبات السطحات بمختلف أنواعها.",
  subtitleIntraCity: "إدارة ومتابعة طلبات السطحات المحلية داخل المدن وتعيين السائقين المتاحين.",
  subtitleInterCity: "إدارة رحلات السطحات بين المدن عبر المسارات المحددة والأسعار المعتمدة مسبقاً.",
  // InterCity Purpose-Built Header (Phase 2C.2)
  interCityHeaderTitle: "عمليات النقل بين المدن",
  interCityHeaderSubtitle:
    "إدارة ومتابعة طلبات نقل المركبات لمسافات طويلة عبر ممرات ومسارات النقل المعتمدة بين المدن.",

  // Corridor Explorer (Phase 2C.2)
  corridorsExplorerTitle: "ممرات النقل المعتمدة",
  corridorsExplorerSubtitle: "استعراض مسارات النقل والتسعيرات المرجعية المعتمدة بين المدن",
  corridorsAriaLabel: "ممرات النقل بين المدن",
  corridorAll: "جميع الممرات",
  corridorAllDesc: "استعراض ممرات النقل المعتمدة والتسعيرات المرجعية في النظام",
  searchCorridorsPlaceholder: "البحث في ممرات النقل بالمدينة...",
  searchCorridorsAriaLabel: "البحث في ممرات النقل المعتمدة",
  clearCorridorSearch: "مسح بحث الممرات",
  noCorridorsFound: "لا توجد ممرات مطابقة للبحث",
  noAvailableCorridors: "لا توجد ممرات نقل نشطة مسجلة حالياً في النظام",
  corridorsLoading: "جاري تحميل ممرات النقل المعتمدة...",
  corridorsLoadError: "تعذر تحميل بيانات ممرات النقل",
  unspecifiedCity: "مدينة غير محددة",
  corridorChipAriaLabel:
    "ممر نقل من {{origin}} إلى {{destination}}، التسعيرة المرجعية {{cost}} ريال",

  // Selected Corridor Context (Phase 2C.2)
  selectedCorridorTitle: "بيانات الممر المحدد",
  referenceTariff: "التسعيرة المرجعية للمسار",
  referenceTariffNote:
    "تسعيرة مرجعية معتمدة لمسار النقل؛ المبالغ المسجلة في الطلبات مستقلة وترتبط بتفاصيل كل طلب.",
  corridorInspectionBadge: "معاينة مرجعية",
  corridorInspectionNotice:
    "معاينة مرجعية لبيانات المسار؛ قائمة الطلبات أدناه تعرض طلبات النقل بين المدن دون تصفية حسب المسار.",
  corridorDirectionalNotice: "مسار اتجاهي محدد: حركة النقل من نقطة الانطلاق إلى نقطة الوصول حصراً.",
  clearCorridorSelection: "إلغاء تحديد الممر",
  manageCorridorInReference: "إدارة المسار في البيانات المرجعية",
  corridorReferenceId: "معرّف المرجع",
  corridorActiveStatus: "ممر نشط",
  corridorInactiveStatus: "ممر غير نشط",
  routeStatusActive: "مسار مفعّل",
  routeStatusInactive: "مسار غير مفعّل",

  // Network / Map View Entry Point (Phase 2C.2)
  viewNetwork: "عرض شبكة النقل",
  viewNetworkAriaLabel: "عرض المخطط العام لشبكة ممرات النقل بين المدن",
  networkModalTitle: "شبكة مسارات النقل بين المدن",
  networkModalDesc:
    "نظرة عامة على ممرات النقل المعتمدة والربط التشغيلي بين المدن والأسعار المرجعية",
  networkSchematicNoticeTitle: "نظرة عامة على شبكة المسارات",
  networkSchematicNotice:
    "مخطط عام يوضح ممرات النقل المعتمدة والربط التشغيلي بين المدن والتسعيرات المرجعية للخدمة.",
  networkActiveCorridorsCount: "ممرات النقل النشطة ({{count}})",
  networkOriginCitiesCount: "مدن الانطلاق المعتمدة ({{count}})",
  networkDestinationCitiesCount: "مدن الوصول المعتمدة ({{count}})",
  networkSelectCorridorAction: "معاينة تفاصيل المسار",
  closeNetworkModal: "إغلاق النافذة",
  breadcrumbLabel: "مسار التنقل",
  breadcrumbDashboard: "لوحة الإدارة",
  breadcrumbTowTruck: "عمليات السطحات",

  // ── Phase 2D.3: Dedicated InterCity Full Order Workspace ─────────────────
  // Journey Header
  interCityWorkspaceEyebrow: "مساحة عمليات النقل بين المدن · سجل تشغيلي متكامل",
  transportJourney: "رحلة النقل المعتمدة",
  departureCity: "مدينة الانطلاق",
  arrivalCity: "مدينة الوصول",
  cityMissing: "المدينة غير محددة",
  routeCorridor: "ممر النقل",
  interCityBadge: "نقل بين المدن",

  // Transport Corridor Section
  corridorSectionTitle: "ممر النقل البري والمسار المعتمد",
  corridorSectionSubtitle: "بيانات مسار النقل لمسافات طويلة بين المدن والتسعيرة المرجعية",
  originPoint: "نقطة الانطلاق (المرسل)",
  destinationPoint: "نقطة الوصول (المستلم)",
  configuredRoadId: "معرّف الطريق المعتمد",
  referenceRoadTariff: "التسعيرة المرجعية للمسار",
  referenceTariffLoading: "جارٍ تحميل التسعيرة المرجعية للمسار…",
  referenceTariffUnavailable: "التسعيرة المرجعية للطريق غير متاحة",
  referenceTariffComparisonMatch:
    "المبلغ المسجل في الطلب يطابق التسعيرة المرجعية الحالية للمسار ({{cost}} ر.س)",
  referenceTariffComparisonDiff:
    "المبلغ المسجل في الطلب ({{recorded}} ر.س) يختلف عن التسعيرة المرجعية الحالية للمسار ({{reference}} ر.س)",
  recordedOrderAmount: "المبلغ المسجل في وثيقة الطلب",
  referenceTariffNotice:
    "تنبيه: التسعيرة المرجعية للطريق هي قيمة استرشادية من إعدادات مسارات الطرق، وتبقى منفصلة تماماً عن المبلغ المسجل في وثيقة الطلب.",
  openNetworkOverview: "استعراض شبكة ممرات النقل",
  directJourneyRoute: "عرض خط سير الرحلة المباشر",
  noRoadConfigured: "لا يوجد مسار طريق معتمد مسجل لهذا الطلب",

  // Sender & Receiver Logistics Section
  logisticsPartiesTitle: "أطراف عملية النقل واللوجستيات",
  logisticsPartiesSubtitle:
    "الفصل الواضح بين الطرف المرسل (صاحب الطلب) والطرف المستلم في نقطة الوصول",
  senderParty: "الطرف المرسل (صاحب الطلب)",
  receiverParty: "الطرف المستلم (نقطة الوصول)",
  senderPickupAddress: "عنوان استلام الشحنة",
  receiverDeliveryAddress: "عنوان تسليم الشحنة",
  receiverUnavailable: "بيانات المستلم غير متوفرة",
  receiverNotCustomerNote:
    "ملاحظة: الطرف المستلم جهة مستقلة في نقطة الوصول ولا يطابق بالضرورة صاحب الطلب.",

  // Transported Vehicle Section
  cargoVehicleTitle: "مركبة الشحن المنقولة",
  cargoVehicleSubtitle: "بيانات المركبة المشحونة كسجل حمولة لوجستية للنقل لمسافات طويلة",
  vehicleMake: "الشركة الصانعة",
  vehicleModel: "طراز المركبة",
  vehicleYear: "سنة الصنع",
  vehiclePlate: "لوحة المركبة",
  vehicleVin: "الرقم التسلسلي (الهيكل)",
  vehicleCargoClassification: "تصنيف الشحنة",
  vehicleCargoType: "مركبة على سطحة نقل",

  // Financial Record Section
  intercityFinanceTitle: "السجل المالي لرحلة النقل",
  intercityFinanceSubtitle: "المبالغ المسجلة في وثيقة الطلب والتسعيرة المرجعية للمسار",
  recordedSubtotal: "المجموع الفرعي المسجل",
  recordedDiscount: "الخصم المسجل",
  recordedTotal: "المبلغ الإجمالي المسجل للطلب",
  referenceTariffCardTitle: "التسعيرة المرجعية للمسار",
  financialRecordNotice:
    "المبالغ المعروضة مسجلة في وثيقة الطلب ولا يعاد احتسابها في الواجهة. تظل التسعيرة المرجعية للمسار قيمة استرشادية مستقلة.",

  // Carrier Assignment & Logistics Actions
  intercityDispatchTitle: "إسناد ناقل الشحنة والعمليات التشغيلية",
  intercityDispatchSubtitle: "إسناد سائق السطحة لنقل المركبة ومتابعة العمليات التشغيلية للرحلة",
  assignedCarrier: "الناقل المعيّن حالياً",
  unassignedCarrier: "لم يتم إسناد ناقل للرحلة",
  intercityPaidSafeguardTitle: "إسناد الناقل مقفل احترازياً للطلبات المدفوعة",
  intercityPaidSafeguardDesc:
    "تم حظر إسناد السائق لهذا الطلب لأنه مدفوع مسبقاً، وذلك لحماية السجلات المالية المعتمدة للرحلات بين المدن.",
  intercityEligibleDispatchDesc:
    "طلب بين المدن مؤهل للإسناد: يتم إرسال التكلفة الإجمالية المسجلة مسبقاً في الطلب دون تعديل يدوي.",

  // Unknown Service Type Fallback
  unknownServiceTypeTitle: "نوع خدمة غير محدد",
  unknownServiceTypeDesc:
    "تعذر تحديد نوع خدمة هذا الطلب بشكل مؤكد من سجلات النظام (داخل المدن / بين المدن).",
  unknownServiceSafeModeNotice:
    "تم تفعيل وضع القراءة الآمن لحماية البيانات ومنع تنفيذ عمليات الإسناد أو التسعير غير المتوافقة. يمكنك الاطلاع على بيانات الطلب المؤكدة أو إلغاء الطلب إذا كانت شروط الأهلية تسمح بذلك.",
};
export const towTruckEn: typeof towTruckAr = {
  opsMutationConflict:
    "This action is unavailable because of the order state or another pending or unresolved operation. Check the outcomes before making a new change.",
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
  serverTotal: "Total server requests: {{count}}",
  refresh: "Refresh data",
  refreshing: "Refreshing…",
  updated: "Updated {{time}}",
  notUpdated: "Not updated yet",
  syncStaleBanner:
    "Failed to refresh data from server recently. The data displayed below is the last cached snapshot.",
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
  colOrderTime: "Order & Time",
  colRoute: "Recorded Route",
  colCustomer: "Customer & Contact",
  colVehicle: "Vehicle & Plate",
  colOrderStatus: "Operational Status",
  colPaymentStatus: "Payment Status",
  colDriver: "Tow Truck Driver",
  colAction: "Action",
  colCorridor: "InterCity Corridor",
  colAmountPayment: "Recorded Amount & Payment",
  roadIdLabel: "Route #{{id}}",
  corridorMissing: "Unspecified corridor in response",
  recordedAmount: "Recorded Amount",
  searchTrackPlaceholder: "Search by track or order number (server-wide)...",
  searchButton: "Search",
  clearSearch: "Clear search",
  searching: "Searching...",
  searchActiveNotice: "Search results for track number:",
  searchTotal: "{{count}} matching results",
  filterAll: "All",
  filterUnassigned: "Needs Assignment",
  filterAssigned: "Assigned",
  filterPaid: "Paid",
  filterAttention: "Needs Review",
  localFilterScope:
    "Quick tabs filter the ({{count}}) orders currently loaded on this page. For server-wide search, use the track number search above.",
  noFilterResults: "No orders match the selected filter on this page.",
  resetFilter: "Show all page orders",
  noSearchResults: "No orders match the entered track number.",
  detailsAction: "Order Details",
  openDetails: "Open Details",
  plateMissing: "No plate",
  routeAlertTitle: "Route Alert",
  routeSame: "Origin and destination are identical",
  routeMissingCoords: "Incomplete coordinates",
  contactCustomer: "Call customer",
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
  paymentPaidHint: "Payment for this request has been confirmed by the server.",
  paymentFailedHint: "Payment for this request has failed.",
  paymentRefundedHint: "Payment for this request has been refunded.",
  paymentMethod: "Payment method",
  methodUnknown: "Payment method not specified",
  paymentMethodUnspecified: "Payment method not specified",
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
  locationUnverified: "Customer-provided coordinates",
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
  preparePermission: "Preparing and sending a quote requires order management permission.",
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
  noActiveDrivers:
    "All driver accounts on this page are currently inactive. Refresh the list or navigate to another page.",
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
  quickPreviewTitle: "Quick Order Preview",
  quickPreviewSubtitle: "Quick summary of trip data and operational state",
  openFullWorkspace: "Open full order workspace",
  backToQueue: "Back to operations queue",
  workspaceTitle: "Order Workspace",
  workspaceSubtitle: "Manage order details, pricing, and driver operations",
  operationalSummary: "Operational Summary",
  verifiedStage: "Current Verified Stage",
  viewOnGoogleMaps: "View route on map",
  viewLocationOnMap: "View location on map",
  routeDetails: "Trip Route & Locations",
  customerAndVehicle: "Customer & Vehicle",
  orderFinances: "Financial Data & Pricing",
  driverAndDispatch: "Driver Dispatch & Operations",
  additionalInfo: "Additional Notes & Attachments",
  noOrderSelected: "No order selected",
  orderNotFound: "Order not found",
  orderNotFoundDesc: "Could not find details for this order or the order ID is invalid.",
  quickPreview: "Quick preview",
  closePreview: "Close preview",
  pickupCoordinates: "Pickup coordinates",
  destinationCoordinates: "Destination coordinates",
  currencySar: "SAR",
  locationQuality: "Location quality",
  nextAction: "Next operational action",
  allOrders: "All orders",
  queueCaption: "Showing {{batch}} of {{total}} requests on server · Newest first",
  syncing: "Syncing…",
  refreshQueue: "Refresh request queue",
  orderNumber: "Order number",
  attachments: "Attachments",
  contact: "Contact",
  cancelReviewAgain:
    "Close this dialog and review the order before starting a new cancellation review.",
  cancelAcknowledged:
    "The server acknowledged cancellation, but the final state is not yet verified.",
  cancelReadFailed:
    "The current state could not be verified. Resubmitting cancellation remains blocked.",
  cancelStorage:
    "The attempt record could not be verified safely. Do not resubmit; check the result or contact support.",
  cancelReviewFailed:
    "Verified order data could not be read. Cancellation was not sent; close this dialog and review again.",
  cancelReviewChanged:
    "The order changed. Cancellation was not sent; close this dialog and review the updated details before confirming again.",
  cancelOperationConflict:
    "Permission changed or another operation is pending or unresolved. Cancellation was not sent.",
  cancelOrder: "Cancel Order",
  cancelOrderTitle: "Cancel Tow Truck Order",
  cancelOrderDescription:
    "You are about to cancel tow truck order {{orderNumber}}. Please review the operational notices carefully.",
  operationalWarning: "Important Operational Notice",
  cancelOrderScopeNotice: "This action cancels the entire order, not merely the assigned driver.",
  cancelOrderTripNotice:
    "Check any linked trip separately; this action does not verify its outcome.",
  cancelOrderIrreversibleNotice: "This action should not be assumed reversible once confirmed.",
  cancelClose: "Close / Keep Order",
  close: "Close",
  confirmCancelOrder: "Confirm Cancellation",
  cancellingOrder: "Cancelling order…",
  cancelSuccess: "The latest read shows that the order is canceled.",
  cancelSuccessHint:
    "This observes the order state; it does not prove that this attempt caused the cancellation.",
  cancelBlockedPaid: "The order cannot be cancelled after payment has been completed.",
  cancelConflictRefreshed:
    "The server rejected cancellation. Close this dialog and review the order before starting a new review.",
  cancelBlockedAlreadyCancelled: "This order is already cancelled and cannot be cancelled again.",
  cancelBlockedUnknownPayment:
    "Payment status is unconfirmed; cancellation eligibility cannot be determined until verified.",
  cancelNotFound: "The order is unavailable or you do not have permission to cancel it.",
  cancelForbidden: "You do not have permission to cancel this order.",
  cancelValidation: "Cancellation request was rejected due to invalid data.",
  cancelUncertain: "The cancellation outcome is unconfirmed. Check the result before trying again.",
  cancelUncertainHint:
    "Closing this dialog does not undo the attempt. If cancellation is not observed, resubmission stays blocked; ask support to verify the server-side attempt using the order number.",
  cancelReconcile: "Check cancellation outcome",
  cancelChecking: "Checking order status…",
  orderCancelledHint:
    "This order has been cancelled; no operational actions or driver dispatch can be performed.",
  reassignWorkflowNotice:
    "This order already has an assigned driver. To assign a replacement driver, first unassign the current driver from the 'Driver Operations' section above, then assign the desired driver.",
  goToUnassign: "Go to Unassign Driver",
  driverReplacementReady:
    "The previous driver was successfully unassigned from this request. You can now select a replacement driver and submit cost and duration.",
  cancelUnavailableTitle: "Order Cancellation Unavailable",
  serviceIntraCity: "IntraCity Tow Truck",
  serviceInterCity: "InterCity Tow Truck",
  serviceUnknown: "Unspecified Service",
  intercityRoute: "InterCity Route",
  intercityReceiver: "Receiver Details",
  name: "Name",
  intercityFixedPriceNotice: "Predefined fixed route price approved for this InterCity request",
  intercityAgreedPriceNotice:
    "InterCity Tow Truck order: Cost is predefined and approved based on the route, and cannot be edited manually.",
  intercityCostSummaryDesc: "Predefined InterCity route cost agreed for order",
  durationEstimateLabel: "Estimated Duration (Admin Estimate)",
  durationEstimateHint:
    "Administrative duration estimate in hours or days for the intercity trip (required by server)",
  adminDurationSummaryDesc: "Administrative estimate required for assignment",
  assignmentPaidInterCityBlocked:
    "Driver assignment for paid InterCity orders is safeguarded until financial backend behavior is confirmed.",
  assignmentPaidInterCityBlockedDetail:
    "This order is fully paid; driver assignment for paid intercity trips is locked to protect verified financial records.",
  intercityFixedPriceNoticeTitle: "Predefined InterCity Route Price",
  intercityFixedPriceNoticeDesc:
    "The total price displayed reflects the agreed amount on the order based on predefined route pricing.",
  intercityRouteDetailsMissing: "Route details unavailable in current order response",
  intercityRoutesAdmin: "InterCity Routes",
  serviceTypeNavLabel: "Service Type",
  filterAllServices: "All Tow Truck Orders",
  serviceTypeFilterNoticeTitle: "Service Filter ({{service}})",
  serviceTypeFilterNoticeDesc:
    "Filtered view displaying specific service requests directly from system records.",
  noServiceFilterResults: "No matching service-type orders returned from the server",
  serviceBatchScopeNotice: "Displaying {{count}} registered orders from the system.",
  receiver: "Receiver Details (InterCity)",
  receiverMissing: "No receiver details recorded",
  operationsNavLabel: "Tow truck operations workspace navigation",
  navAllOperations: "All Tow Truck Operations",
  navAllDesc: "Comprehensive overview of all urban and intercity requests",
  navAllBadge: "Unified",
  navIntraCity: "IntraCity Operations",
  navIntraCityDesc: "Local transport and recovery requests within city limits",
  navIntraCityBadge: "IntraCity",
  navInterCity: "InterCity Operations",
  navInterCityDesc: "Highway corridors and intercity dispatch scheduling",
  navInterCityBadge: "InterCity",
  activeWorkspaceIndicator: "Active Workspace",
  eyebrowAll: "Tow Truck Operations · All Operations",
  eyebrowIntraCity: "Tow Truck Operations · IntraCity",
  eyebrowInterCity: "Tow Truck Operations · InterCity",
  subtitleAll:
    "Unified operational dashboard for monitoring and dispatching all tow truck requests.",
  subtitleIntraCity:
    "Manage and monitor local intra-city tow truck requests and assign available drivers.",
  subtitleInterCity:
    "Manage intercity trips across defined highway routes with predefined route pricing.",
  // InterCity Purpose-Built Header (Phase 2C.2)
  interCityHeaderTitle: "InterCity Transport Operations",
  interCityHeaderSubtitle:
    "Manage and monitor long-distance vehicle transport orders across configured intercity corridors.",

  // Corridor Explorer (Phase 2C.2)
  corridorsExplorerTitle: "Configured Transport Corridors",
  corridorsExplorerSubtitle:
    "Explore city-to-city transport corridors and approved reference tariffs",
  corridorsAriaLabel: "InterCity transport corridors",
  corridorAll: "All Corridors",
  corridorAllDesc: "Overview of configured transport corridors and reference tariffs",
  searchCorridorsPlaceholder: "Search corridors by city...",
  searchCorridorsAriaLabel: "Search configured transport corridors",
  clearCorridorSearch: "Clear corridor search",
  noCorridorsFound: "No corridors matching search",
  noAvailableCorridors: "No active transport corridors currently configured",
  corridorsLoading: "Loading configured transport corridors...",
  corridorsLoadError: "Could not load transport corridors data",
  unspecifiedCity: "Unspecified City",
  corridorChipAriaLabel:
    "Corridor from {{origin}} to {{destination}}, reference tariff {{cost}} SAR",

  // Selected Corridor Context (Phase 2C.2)
  selectedCorridorTitle: "Selected Corridor Details",
  referenceTariff: "Route Reference Tariff",
  referenceTariffNote:
    "Approved reference tariff for the transport corridor. Order amounts are recorded independently per request.",
  corridorInspectionBadge: "Reference Inspection",
  corridorInspectionNotice:
    "Reference inspection of corridor details. The order queue below displays intercity requests without route filtering.",
  corridorDirectionalNotice:
    "Directional corridor: transport runs strictly from departure city to arrival destination.",
  clearCorridorSelection: "Clear corridor selection",
  manageCorridorInReference: "Manage route in Reference Data",
  corridorReferenceId: "Reference ID",
  corridorActiveStatus: "Active Corridor",
  corridorInactiveStatus: "Inactive Corridor",
  routeStatusActive: "Active Route",
  routeStatusInactive: "Inactive Route",

  // Network / Map View Entry Point (Phase 2C.2)
  viewNetwork: "View Transport Network",
  viewNetworkAriaLabel: "View schematic overview of intercity transport network",
  networkModalTitle: "InterCity Transport Network",
  networkModalDesc:
    "Operational overview of configured transport corridors, city connections, and reference tariffs",
  networkSchematicNoticeTitle: "Route Network Overview",
  networkSchematicNotice:
    "Operational overview displaying configured transport corridors, city connections, and reference tariffs.",
  networkActiveCorridorsCount: "Active Corridors ({{count}})",
  networkOriginCitiesCount: "Departure Cities ({{count}})",
  networkDestinationCitiesCount: "Arrival Cities ({{count}})",
  networkSelectCorridorAction: "Inspect Route Details",
  closeNetworkModal: "Close Window",
  breadcrumbLabel: "Breadcrumb",
  breadcrumbDashboard: "Admin Dashboard",
  breadcrumbTowTruck: "Tow Truck Operations",

  // ── Phase 2D.3: Dedicated InterCity Full Order Workspace ─────────────────
  // Journey Header
  interCityWorkspaceEyebrow: "InterCity Transport Operations · Comprehensive Logistical Record",
  transportJourney: "Approved Transport Journey",
  departureCity: "Departure City",
  arrivalCity: "Arrival City",
  cityMissing: "City Not Specified",
  routeCorridor: "Transport Corridor",
  interCityBadge: "InterCity Transport",

  // Transport Corridor Section
  corridorSectionTitle: "Transport Corridor & Approved Route",
  corridorSectionSubtitle: "Long-distance intercity transport route details and reference tariff",
  originPoint: "Departure Point (Origin)",
  destinationPoint: "Arrival Point (Destination)",
  configuredRoadId: "Configured Road ID",
  referenceRoadTariff: "Route Reference Tariff",
  referenceTariffLoading: "Loading route reference tariff...",
  referenceTariffUnavailable: "Route reference tariff unavailable",
  referenceTariffComparisonMatch:
    "Recorded order amount matches current route reference tariff ({{cost}} SAR)",
  referenceTariffComparisonDiff:
    "Recorded order amount ({{recorded}} SAR) differs from current route reference tariff ({{reference}} SAR)",
  recordedOrderAmount: "Recorded Amount on Order",
  referenceTariffNotice:
    "Note: Route reference tariff is an informative reference from road configurations and remains completely separate from the recorded order amount.",
  openNetworkOverview: "View Transport Network",
  directJourneyRoute: "Direct Journey Directions",
  noRoadConfigured: "No configured road registered for this order",

  // Sender & Receiver Logistics Section
  logisticsPartiesTitle: "Logistics Parties & Contacts",
  logisticsPartiesSubtitle:
    "Clear distinction between sending party (customer) and receiving party at destination",
  senderParty: "Sending Party (Customer)",
  receiverParty: "Receiving Party (Delivery Point)",
  senderPickupAddress: "Registered Pickup Address",
  receiverDeliveryAddress: "Registered Delivery Address",
  receiverUnavailable: "Receiver details unavailable",
  receiverNotCustomerNote:
    "Note: The receiving party is a distinct entity at delivery and is not assumed to be the requesting customer.",

  // Transported Vehicle Section
  cargoVehicleTitle: "Transported Vehicle Cargo",
  cargoVehicleSubtitle: "Vehicle cargo specifications for long-distance transport logistics",
  vehicleMake: "Make",
  vehicleModel: "Model",
  vehicleYear: "Year",
  vehiclePlate: "License Plate",
  vehicleVin: "Serial Number (VIN)",
  vehicleCargoClassification: "Cargo Classification",
  vehicleCargoType: "Vehicle on Transport Carrier",

  // Financial Record Section
  intercityFinanceTitle: "Transport Journey Financial Record",
  intercityFinanceSubtitle: "Recorded order amounts and route reference tariff",
  recordedSubtotal: "Recorded Subtotal",
  recordedDiscount: "Recorded Discount",
  recordedTotal: "Recorded Order Total",
  referenceTariffCardTitle: "Route Reference Tariff",
  financialRecordNotice:
    "Amounts displayed are recorded on the order record and are not recalculated in the frontend. Reference tariff remains independent.",

  // Carrier Assignment & Logistics Actions
  intercityDispatchTitle: "Carrier Assignment & Operations",
  intercityDispatchSubtitle:
    "Assign transport carrier driver and manage operational trip workflows",
  assignedCarrier: "Currently Assigned Carrier",
  unassignedCarrier: "No carrier assigned for this trip",
  intercityPaidSafeguardTitle: "Carrier Assignment Safeguarded for Paid Orders",
  intercityPaidSafeguardDesc:
    "Driver assignment is blocked because this InterCity order is pre-paid, safeguarding approved financial records.",
  intercityEligibleDispatchDesc:
    "Eligible InterCity order for assignment: recorded total cost is dispatched without manual modification.",

  // Unknown Service Type Fallback
  unknownServiceTypeTitle: "Unknown Service Type",
  unknownServiceTypeDesc:
    "The service type for this order could not be reliably determined (IntraCity / InterCity).",
  unknownServiceSafeModeNotice:
    "Safe read-only mode is active to protect data and prevent incompatible assignment or pricing operations. You can review verified details or cancel if permitted.",
};
