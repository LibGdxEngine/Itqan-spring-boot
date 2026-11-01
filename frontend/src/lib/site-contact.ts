/**
 * Official contact channels. Used when the matching Admin → Settings field is empty;
 * a value saved in the admin settings still takes precedence.
 *
 * Contact is by WhatsApp only (no public email for now).
 */
export const SITE_CONTACT = {
  /** International format; whatsappLink() strips everything but digits. */
  whatsappNumber: "+20 10 61987462",
  facebookUrl: "https://www.facebook.com/profile.php?id=61596225476525",
} as const

/** wa.me needs digits only, e.g. 201061987462. */
export const SITE_WHATSAPP_URL = `https://wa.me/${SITE_CONTACT.whatsappNumber.replace(/\D/g, "")}`

/** Public profiles for Organization schema `sameAs`. Add new channels here as they launch. */
export const SOCIAL_PROFILES: string[] = [SITE_CONTACT.facebookUrl]
