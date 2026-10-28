"use client"

import { useTranslations } from "next-intl"

import { Textarea } from "@/components/ui/textarea"
import { QuestionResponse } from "@/lib/api"

export interface QuestionAnswer {
  selectedOptionIds: number[]
  answerText: string
}

interface QuestionCardProps {
  index: number
  total: number
  question: QuestionResponse
  answer: QuestionAnswer
  onChange: (next: QuestionAnswer) => void
  disabled?: boolean
}

export function QuestionCard({
  index,
  total,
  question,
  answer,
  onChange,
  disabled,
}: QuestionCardProps) {
  const t = useTranslations()
  const type = question.questionType

  const setSingleOption = (optionId: number) => {
    onChange({ ...answer, selectedOptionIds: [optionId] })
  }
  const setText = (value: string) => {
    onChange({ ...answer, answerText: value })
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-ink-3">
        <span>{t("quiz.player.questionLabel", { index: index + 1, total })}</span>
        {typeof question.points === "number" && question.points > 0 && (
          <span className="rounded-full bg-subtle px-2 py-0.5 text-ink-2">
            {t("quiz.player.points", { count: question.points })}
          </span>
        )}
      </div>
      <p className="mb-4 text-base font-medium text-ink">{question.questionText}</p>

      {(type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") && (
        <ul className="space-y-2">
          {(question.options ?? [])
            .slice()
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            .map((option) => {
              if (option.id == null) return null
              const optionId = option.id
              const checked = answer.selectedOptionIds.includes(optionId)
              return (
                <li key={optionId}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                      checked
                        ? "border-brand bg-brand-soft text-ink"
                        : "border-line bg-paper text-ink-button hover:border-ring-warm"
                    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      className="mt-1 accent-brand"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => setSingleOption(optionId)}
                    />
                    <span>{option.optionText}</span>
                  </label>
                </li>
              )
            })}
        </ul>
      )}

      {type === "SHORT_ANSWER" && (
        <Textarea
          rows={4}
          value={answer.answerText}
          disabled={disabled}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("quiz.player.shortAnswerPlaceholder")}
        />
      )}
    </div>
  )
}
