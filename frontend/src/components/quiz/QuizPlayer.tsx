"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import {
  QuestionResponse,
  QuizAttemptResponse,
  QuizManagementService,
  QuizResponse,
  SubmitAnswerRequest,
} from "@/lib/api"
import { QuestionAnswer, QuestionCard } from "./QuestionCard"
import { QuizResult } from "./QuizResult"

interface QuizPlayerProps {
  quiz: QuizResponse
  backHref: string
}

function emptyAnswer(): QuestionAnswer {
  return { selectedOptionIds: [], answerText: "" }
}

function buildSubmissions(
  questions: QuestionResponse[],
  answers: Record<number, QuestionAnswer>,
): SubmitAnswerRequest[] {
  return questions
    .filter((q) => q.id != null)
    .map((q) => ({
      questionId: q.id!,
      answerText: answers[q.id!]?.answerText || undefined,
      selectedOptionIds: answers[q.id!]?.selectedOptionIds ?? [],
    }))
}

function isAnswered(question: QuestionResponse, answer: QuestionAnswer | undefined): boolean {
  if (!answer) return false
  if (question.questionType === "SHORT_ANSWER") {
    return answer.answerText.trim().length > 0
  }
  return answer.selectedOptionIds.length > 0
}

export function QuizPlayer({ quiz, backHref }: QuizPlayerProps) {
  const t = useTranslations()
  const { toast } = useToast()

  const sortedQuestions = useMemo(
    () =>
      (quiz.questions ?? [])
        .slice()
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
    [quiz.questions],
  )

  const [attempt, setAttempt] = useState<QuizAttemptResponse | null>(null)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizAttemptResponse | null>(null)
  const [answers, setAnswers] = useState<Record<number, QuestionAnswer>>({})
  const [startedAt, setStartedAt] = useState<number | null>(null)

  const start = async () => {
    if (!quiz.id) return
    setStarting(true)
    try {
      const response = await QuizManagementService.startQuizAttempt(quiz.id)
      setAttempt(response)
      setResult(null)
      setAnswers({})
      setStartedAt(Date.now())
    } catch (err) {
      toast({
        title: t("quiz.player.startFailed"),
        description: getErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setStarting(false)
    }
  }

  useEffect(() => {
    if (!attempt && !result) {
      void start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateAnswer = (questionId: number, next: QuestionAnswer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: next }))
  }

  const allAnswered = useMemo(
    () => sortedQuestions.every((q) => (q.id != null ? isAnswered(q, answers[q.id]) : true)),
    [answers, sortedQuestions],
  )

  const submit = async () => {
    if (!attempt?.id || !startedAt) return
    setSubmitting(true)
    try {
      const timeSpent = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
      const response = await QuizManagementService.submitQuiz(attempt.id, {
        answers: buildSubmissions(sortedQuestions, answers),
        timeSpent,
      })
      setResult(response)
    } catch (err) {
      toast({
        title: t("quiz.player.submitFailed"),
        description: getErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (starting || (!attempt && !result)) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-line bg-surface p-10">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    )
  }

  if (result) {
    return (
      <QuizResult
        attempt={result}
        passingScore={quiz.passingScore}
        backHref={backHref}
        onRetry={start}
        retrying={starting}
      />
    )
  }

  if (sortedQuestions.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-2">
        {t("quiz.player.noQuestions")}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-surface p-4 text-sm text-ink-2">
        {t("quiz.player.intro", {
          count: sortedQuestions.length,
          passing: quiz.passingScore ?? 0,
        })}
      </div>

      <div className="space-y-4">
        {sortedQuestions.map((q, idx) => {
          if (q.id == null) return null
          return (
            <QuestionCard
              key={q.id}
              index={idx}
              total={sortedQuestions.length}
              question={q}
              answer={answers[q.id] ?? emptyAnswer()}
              onChange={(next) => updateAnswer(q.id!, next)}
              disabled={submitting}
            />
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4">
        <p className="text-sm text-ink-3">
          {allAnswered
            ? t("quiz.player.allAnswered")
            : t("quiz.player.someUnanswered")}
        </p>
        <Button onClick={submit} disabled={submitting}>
          {submitting ? t("quiz.player.submitting") : t("quiz.player.submit")}
        </Button>
      </div>
    </div>
  )
}
