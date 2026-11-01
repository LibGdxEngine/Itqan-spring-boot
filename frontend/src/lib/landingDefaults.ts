/**
 * Default copy for the landing page "sheikhs and scholars" section.
 * Shown on the landing page when the admin leaves the fields empty, and as
 * placeholders in Admin → Landing page so the admin sees the fallback text.
 */
export const TEACHERS_SECTION_DEFAULTS = {
  ar: {
    title: "مشايخ وعلماء",
    subtitle:
      "تتلمذ على يد مشايخ وعلماء متخصصين في التفسير وعلوم القرآن، لكلٍّ منهم مؤهلاته وإجازاته ومنهجه في التدريس",
  },
  en: {
    title: "Sheikhs and Scholars",
    subtitle:
      "Learn from sheikhs and scholars specialised in Tafseer and Qur'anic sciences, each with their own qualifications, ijazat and teaching method",
  },
} as const
