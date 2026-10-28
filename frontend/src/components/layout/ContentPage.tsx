import { PublicPage } from "@/components/layout/PublicPage"

export interface ContentSection {
  title: string
  body: string
}

/** Long-form text page (About, Privacy, Terms): heading, intro and titled sections. */
export function ContentPage({
  eyebrow,
  title,
  intro,
  sections,
  footnote,
  children,
}: {
  eyebrow?: string
  title: string
  intro?: string
  sections: ContentSection[]
  footnote?: string
  children?: React.ReactNode
}) {
  return (
    <PublicPage>
      <article className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
        <header className="mb-10 border-b border-line pb-8">
          {eyebrow ? <p className="mb-2 text-sm font-semibold uppercase tracking-[0.15em] text-brand">{eyebrow}</p> : null}
          <h1 className="text-4xl text-ink sm:text-5xl" style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}>
            {title}
          </h1>
          {intro ? <p className="mt-4 text-lg leading-relaxed text-ink-2">{intro}</p> : null}
        </header>
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 text-xl font-semibold text-ink">{section.title}</h2>
              <p className="whitespace-pre-line leading-relaxed text-ink-2">{section.body}</p>
            </section>
          ))}
        </div>
        {children}
        {footnote ? <p className="mt-12 border-t border-line pt-6 text-sm text-ink-3">{footnote}</p> : null}
      </article>
    </PublicPage>
  )
}
