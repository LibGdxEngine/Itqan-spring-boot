import Link from "next/link"
import { useTranslations } from "next-intl"
import { Newspaper, Clock, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ArticleSummary } from "@/lib/articles"
import type { LandingArticle } from "@/lib/landingPage"

interface ArticleCardProps {
  article: ArticleSummary | LandingArticle
}

export function ArticleCard({ article }: ArticleCardProps) {
  const t = useTranslations()

  return (
    <Card className="flex h-full flex-col transition-shadow duration-300 hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="h-44 w-full overflow-hidden rounded-t-2xl bg-[#c96442]">
          {article.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Newspaper className="h-14 w-14 text-[#faf9f5] opacity-80" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col p-6">
        {article.category ? (
          <span className="mb-2 inline-flex w-fit rounded-full bg-[#f0eee6] px-2 py-1 text-xs font-semibold text-[#c96442]">
            {article.category}
          </span>
        ) : null}
        <h3
          className="mb-2 line-clamp-2 text-xl text-[#141413]"
          style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
        >
          {article.title}
        </h3>
        {article.description ? (
          <p className="mb-4 line-clamp-3 text-sm text-[#5e5d59]">
            {article.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2 text-sm text-[#87867f] ltr-flex">
          {article.authorName ? (
            <span className="truncate">
              {t("articles.by")} {article.authorName}
            </span>
          ) : (
            <span />
          )}
          <span className="flex shrink-0 items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {t("articles.readingTime", { minutes: article.readingTimeMinutes })}
          </span>
        </div>
      </CardContent>
      <CardFooter className="mt-auto p-6 pt-0">
        <Link href={`/articles/${article.slug}`} className="w-full">
          <Button
            variant="outline"
            className={cn("w-full justify-center gap-2")}
          >
            {t("articles.readMore")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

export default ArticleCard
