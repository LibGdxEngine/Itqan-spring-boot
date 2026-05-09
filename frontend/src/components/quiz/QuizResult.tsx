"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { CheckCircle2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { QuizAttemptResponse } from "@/lib/api"

interface QuizResultProps {
  attempt: QuizAttemptResponse
  passingScore?: number
  backHref: string
  onRetry?: () => void
  retrying?: boolean
}

export function QuizResult({ attempt, passingScore, backHref, onRetry, retrying }: QuizResultProps) {
  const t = useTranslations()
  const passed = attempt.passed === true
  const score = typeof attempt.score === "number" ? attempt.score : 0

  return (
    <div className="space-y-6">
      <div
        className={`rounded-xl border p-6 ${
          passed
            ? "border-[#c8e6c9] bg-[#f1f8f1] text-[#1f4f2a]"
            : "border-[#f3c9be] bg-[#fdf3ef] text-[#7a2e16]"
        }`}
      >
        <div className="flex items-center gap-3">
          {passed ? <CheckCircle2 className="h-7 w-7" /> : <XCircle className="h-7 w-7" />}
          <h2 className="text-xl font-semibold">
            {passed ? t("quiz.result.passedTitle") : t("quiz.result.failedTitle")}
          </h2>
        </div>
        <p className="mt-3 text-3xl font-bold">{score.toFixed(1)}%</p>
        {typeof passingScore === "number" && (
          <p className="mt-1 text-sm">
            {t("quiz.result.passingScore", { score: passingScore })}
          </p>
        )}
      </div>

      {Array.isArray(attempt.answers) && attempt.answers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#141413]">{t("quiz.result.breakdownTitle")}</h3>
          <ul className="space-y-2">
            {attempt.answers.map((answer, idx) => {
              const correct = answer.isCorrect === true
              return (
                <li
                  key={`${answer.questionId}-${idx}`}
                  className="rounded-lg border border-[#f0eee6] bg-[#faf9f5] p-4"
                >
                  <p className="font-medium text-[#141413]">{answer.questionText}</p>
                  <p className="mt-2 text-sm text-[#5e5d59]">
                    {t("quiz.result.yourAnswer")}:{" "}
                    <span className={correct ? "text-[#1f7a3a]" : "text-[#b53333]"}>
                      {answer.answerText && answer.answerText.length > 0
                        ? answer.answerText
                        : (answer.selectedOptionIds ?? []).join(", ") ||
                          t("quiz.result.noAnswer")}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-[#87867f]">
                    {t("quiz.result.pointsEarned", {
                      earned: answer.pointsEarned ?? 0,
                      total: answer.totalPoints ?? 0,
                    })}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {onRetry && (
          <Button onClick={onRetry} disabled={retrying}>
            {retrying ? t("quiz.result.retrying") : t("quiz.result.retry")}
          </Button>
        )}
        <Link
          href={backHref}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-[#e8e6dc] bg-transparent px-6 text-sm font-medium text-[#141413] transition hover:bg-[#f0eee6]"
        >
          {t("quiz.result.backToLesson")}
        </Link>
      </div>
    </div>
  )
}
