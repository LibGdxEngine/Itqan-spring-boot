"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Loader2, Save } from "lucide-react"

import { FormField, PageHeader, Panel } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { SiteSettings, settingsApi } from "@/lib/admin-api"

type FieldKind = "text" | "email" | "url" | "tel" | "textarea" | "toggle"

const SECTIONS: { key: string; fields: { key: string; kind: FieldKind; ltr?: boolean }[] }[] = [
  {
    key: "general",
    fields: [
      { key: "siteName", kind: "text" },
      { key: "tagline", kind: "text" },
      { key: "maintenanceMessage", kind: "textarea" },
    ],
  },
  {
    key: "contact",
    fields: [
      { key: "contactEmail", kind: "email", ltr: true },
      { key: "contactPhone", kind: "tel", ltr: true },
      { key: "whatsappNumber", kind: "tel", ltr: true },
      { key: "address", kind: "textarea" },
    ],
  },
  {
    key: "social",
    fields: [
      { key: "facebookUrl", kind: "url", ltr: true },
      { key: "instagramUrl", kind: "url", ltr: true },
      { key: "youtubeUrl", kind: "url", ltr: true },
      { key: "xUrl", kind: "url", ltr: true },
      { key: "tiktokUrl", kind: "url", ltr: true },
      { key: "telegramUrl", kind: "url", ltr: true },
    ],
  },
  {
    key: "payments",
    fields: [
      { key: "defaultCurrency", kind: "text", ltr: true },
      { key: "manualPaymentsEnabled", kind: "toggle" },
      { key: "cardPaymentsEnabled", kind: "toggle" },
    ],
  },
]

export default function AdminSettingsPage() {
  const t = useTranslations("admin.settings")
  const tc = useTranslations("admin.common")
  const { toast } = useToast()
  const [saved, setSaved] = React.useState<SiteSettings | null>(null)
  const [values, setValues] = React.useState<SiteSettings>({})
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    settingsApi
      .get()
      .then((s) => {
        setSaved(s)
        setValues(s)
      })
      .catch((err) => setError(getErrorMessage(err)))
  }, [])

  const changed = saved ? Object.keys(values).filter((key) => values[key] !== saved[key]) : []

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (changed.length === 0) return
    setSaving(true)
    try {
      const next = await settingsApi.update(Object.fromEntries(changed.map((key) => [key, values[key]])))
      setSaved(next)
      setValues(next)
      toast({ title: t("saved") })
    } catch (err) {
      toast({ title: tc("failed"), description: getErrorMessage(err), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return <p className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
  }

  if (!saved) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <form onSubmit={(e) => void save(e)}>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button type="submit" disabled={saving || changed.length === 0}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {changed.length > 0 ? t("saveCount", { count: changed.length }) : t("save")}
          </Button>
        }
      />
      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <Panel key={section.key} title={t(`sections.${section.key}`)}>
            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
              {section.fields.map((field) => {
                const id = `setting-${field.key}`
                const value = values[field.key] ?? ""
                const set = (next: string) => setValues((v) => ({ ...v, [field.key]: next }))
                if (field.kind === "toggle") {
                  return (
                    <label key={field.key} htmlFor={id} className="flex items-start gap-3 rounded-lg border border-line-strong bg-paper p-3">
                      <Checkbox id={id} checked={value === "true"} onCheckedChange={(c) => set(c === true ? "true" : "false")} />
                      <span>
                        <span className="block text-sm font-medium text-ink">{t(`fields.${field.key}`)}</span>
                        <span className="block text-xs text-ink-3">{t(`hints.${field.key}`)}</span>
                      </span>
                    </label>
                  )
                }
                return (
                  <div key={field.key} className={field.kind === "textarea" ? "md:col-span-2" : undefined}>
                    <FormField
                      label={t(`fields.${field.key}`)}
                      htmlFor={id}
                      hint={t.has(`hints.${field.key}`) ? t(`hints.${field.key}`) : undefined}
                    >
                      {field.kind === "textarea" ? (
                        <Textarea id={id} rows={2} value={value} onChange={(e) => set(e.target.value)} />
                      ) : (
                        <Input
                          id={id}
                          type={field.kind}
                          dir={field.ltr ? "ltr" : undefined}
                          value={value}
                          onChange={(e) => set(e.target.value)}
                        />
                      )}
                    </FormField>
                  </div>
                )
              })}
            </div>
          </Panel>
        ))}
      </div>
    </form>
  )
}
