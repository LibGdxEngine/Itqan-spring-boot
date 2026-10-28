import { describe, expect, it } from "vitest"
import { formatPrice, whatsappLink } from "../use-site-currency"

describe("formatPrice", () => {
  it("shows the free label for zero", () => {
    expect(formatPrice(0, "EGP", "en", "Free")).toBe("Free")
  })

  it("formats in the site currency, without decimals for whole amounts", () => {
    expect(formatPrice(250, "EGP", "en", "Free")).toMatch(/EGP\s?250$/)
    expect(formatPrice(99.5, "USD", "en", "Free")).toBe("$99.50")
  })

  it("falls back to plain text for an invalid currency code", () => {
    expect(formatPrice(10, "NOT-A-CODE", "en", "Free")).toBe("10 NOT-A-CODE")
  })
})

describe("whatsappLink", () => {
  it("keeps digits only and encodes the message", () => {
    expect(whatsappLink("+20 100-123-4567", "Hi there")).toBe("https://wa.me/201001234567?text=Hi%20there")
  })

  it("returns null when there is no number", () => {
    expect(whatsappLink(undefined)).toBeNull()
    expect(whatsappLink("  ")).toBeNull()
  })
})
