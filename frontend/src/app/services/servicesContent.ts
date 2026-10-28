/**
 * Academy Services — content (Arabic only for now).
 *
 * Single source of truth for the /services page. To add English later,
 * translate the strings here (or lift them into a `services` namespace in
 * messages/*.json). If services ever become admin-managed, swap `SERVICES`
 * for an API fetch — the page reads from these exports only.
 */

// TODO: replace with the academy's real contact details before shipping.
// `whatsapp` must be digits only in international format (no +, spaces or dashes).
export const CONTACT = {
  // Real numbers come from Admin → Settings; this is only the email fallback.
  email: "info@itqan.academy",
} as const

export type ServiceGroupKey = "scholarly" | "teaching"

export interface ServiceGroupMeta {
  key: ServiceGroupKey
  label: string
}

/** Icon keys map to lucide-react components inside ServicesClient. */
export type ServiceIcon =
  | "ScrollText"
  | "BookOpenCheck"
  | "SpellCheck"
  | "BookOpen"
  | "Languages"

export interface Service {
  /** URL fragment used for the in-page anchor link (e.g. #tahqiq). */
  slug: string
  icon: ServiceIcon
  group: ServiceGroupKey
  /** Card + detail heading. */
  title: string
  /** One/two-line description shown on the overview card. */
  summary: string
  /** Longer paragraph shown in the detail row. */
  description: string
  /** "ماذا تشمل الخدمة" bullet list. */
  includes: string[]
}

export const SERVICE_GROUPS: ServiceGroupMeta[] = [
  { key: "scholarly", label: "الخدمات العلمية والتحريرية" },
  { key: "teaching", label: "خدمات التعليم" },
]

export const SERVICES: Service[] = [
  {
    slug: "tahqiq",
    icon: "ScrollText",
    group: "scholarly",
    title: "تحقيق المخطوطات",
    summary: "إخراج النصوص التراثية محقَّقةً تحقيقًا علميًا دقيقًا وفق المنهج الأكاديمي المعتمد.",
    description:
      "نُعنى بإحياء التراث وإخراج المخطوطات في حُلّة علمية موثوقة؛ من نسخ النص وضبطه إلى مقابلة النسخ وتخريج مادته، بما يليق بمكانة الأصل ويخدم الباحث والقارئ.",
    includes: [
      "نسخ المخطوط وضبط النص ضبطًا دقيقًا",
      "مقابلة النسخ الخطية وإثبات الفروق",
      "تخريج الآيات والأحاديث والأعلام والأشعار",
      "كتابة المقدمة الدراسية وإعداد الفهارس العلمية",
    ],
  },
  {
    slug: "muraja",
    icon: "BookOpenCheck",
    group: "scholarly",
    title: "مراجعة الكتب والرسائل",
    summary: "مراجعة علمية ومنهجية للكتب والرسائل الجامعية قبل النشر أو المناقشة.",
    description:
      "نقرأ عملك قراءة ناقدة فاحصة نتثبَّت فيها من سلامة المنهج ودقة المحتوى وصحة التوثيق، ونوافيك بتقرير واضح بالملاحظات والتوصيات يرفع جودة البحث قبل خروجه للناس.",
    includes: [
      "مراجعة المحتوى العلمي ومنهج البحث",
      "ضبط التوثيق والإحالات وقوائم المراجع",
      "فحص الاقتباس والتنبيه على مواضع الاستلال",
      "تقرير مفصَّل بالملاحظات والتوصيات",
    ],
  },
  {
    slug: "tadqiq",
    icon: "SpellCheck",
    group: "scholarly",
    title: "التدقيق اللغوي",
    summary: "تدقيق نحوي وإملائي وأسلوبي يرتقي بنصِّك إلى مستوى النشر.",
    description:
      "نُنقِّح النص من الأخطاء النحوية والإملائية، ونضبط علامات الترقيم، ونُحسِّن الصياغة والأسلوب مع المحافظة على صوتك الخاص، حتى يخرج نصُّك سليمًا متقنًا.",
    includes: [
      "تصحيح الأخطاء النحوية والإملائية",
      "ضبط علامات الترقيم وتنسيق الفقرات",
      "تحسين الأسلوب وسلامة الصياغة",
      "ضبط الشكل (التشكيل) عند الحاجة",
    ],
  },
  {
    slug: "quran",
    icon: "BookOpen",
    group: "teaching",
    title: "تعليم القرآن الكريم",
    summary: "حلقات لتعليم التلاوة والتجويد والحفظ على أيدي مقرئين متقنين.",
    description:
      "برامج متدرّجة لتعليم كتاب الله تلاوةً وتجويدًا وحفظًا، تجمع بين التأصيل العلمي والمتابعة الفردية، بأوقات مرنة تناسب جميع المستويات والأعمار.",
    includes: [
      "تصحيح التلاوة وأحكام التجويد",
      "برامج الحفظ والمراجعة المنظَّمة",
      "الإجازة والإقراء بالسند المتصل",
      "جلسات فردية وجماعية عن بُعد",
    ],
  },
  {
    slug: "non-native",
    icon: "Languages",
    group: "teaching",
    title: "تعليم غير الناطقين بالعربية",
    summary: "برامج لتعليم العربية لغير الناطقين بها من التأسيس إلى الإتقان.",
    description:
      "مسارات تعليمية مصمَّمة للناطقين بغير العربية، تبني المهارات اللغوية خطوة بخطوة عبر مستويات واضحة، مع التركيز على المحادثة والاستعمال الحيّ للغة.",
    includes: [
      "مهارات الاستماع والمحادثة",
      "القراءة والكتابة بالتدرّج",
      "النحو والصرف بأسلوب مبسَّط",
      "مستويات وفق إطار مرجعي واضح",
    ],
  },
]

export const PROCESS_STEPS: string[] = [
  "تواصل معنا واشرح طلبك",
  "نراجع العمل ونرسل إليك عرضًا",
  "نبدأ التنفيذ بعد الاتفاق",
  "نسلِّم العمل مع المتابعة",
]
