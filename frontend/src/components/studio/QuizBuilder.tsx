"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArrowDown, ArrowUp, Copy, Loader2, Plus, Save, Trash2, X } from "lucide-react"

import { ConfirmDialog, FormField, Panel, Select } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { QuestionType, QuizDefinition, QuizOption, QuizQuestion, quizApi } from "@/lib/studio-api"
import { cn } from "@/lib/utils"

const MAX_OPTIONS = 8
let uidCounter = 0
const uid = () => `q${++uidCounter}`

type DraftOption = QuizOption & { uid: string }
type DraftQuestion = Omit<QuizQuestion, "options"> & { uid: string; options: DraftOption[] }
type Draft = Omit<QuizDefinition, "questions"> & { questions: DraftQuestion[] }

function toDraft(quiz: QuizDefinition): Draft {
  return {
    ...quiz,
    questions: quiz.questions.map((q) => ({
      ...q,
      uid: uid(),
      options: q.options.map((o) => ({ ...o, uid: uid(), isCorrect: Boolean(o.isCorrect) })),
    })),
  }
}

function fromDraft(draft: Draft, lessonId: number): QuizDefinition {
  return {
    title: draft.title.trim(),
    description: draft.description?.trim() || null,
    passingScore: draft.passingScore,
    timeLimit: draft.timeLimit || null,
    attemptsAllowed: draft.attemptsAllowed,
    showCorrectAnswers: draft.showCorrectAnswers,
    lessonId,
    questions: draft.questions.map((q) => ({
      id: q.id ?? null,
      questionText: q.questionText.trim(),
      questionType: q.questionType,
      points: q.points,
      correctAnswer: q.questionType === "SHORT_ANSWER" ? (q.correctAnswer ?? "").trim() : null,
      options:
        q.questionType === "SHORT_ANSWER"
          ? []
          : q.options.map((o) => ({ id: o.id ?? null, optionText: o.optionText.trim(), isCorrect: Boolean(o.isCorrect) })),
    })),
  }
}

export function QuizBuilder({
  lessonId,
  lessonTitle,
  quizId,
  onSaved,
  onDeleted,
}: {
  lessonId: number
  lessonTitle: string
  quizId?: number | null
  onSaved: (quizId: number) => void
  onDeleted: () => void
}) {
  const t = useTranslations("studio.quiz")
  const tc = useTranslations("admin.common")
  const { toast } = useToast()
  const [draft, setDraft] = React.useState<Draft | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [errors, setErrors] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)
  const [dirty, setDirty] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  const blankQuestion = React.useCallback(
    (type: QuestionType): DraftQuestion => ({
      uid: uid(),
      questionText: "",
      questionType: type,
      points: 1,
      correctAnswer: "",
      options:
        type === "TRUE_FALSE"
          ? [
              { uid: uid(), optionText: t("true"), isCorrect: true },
              { uid: uid(), optionText: t("false"), isCorrect: false },
            ]
          : type === "MULTIPLE_CHOICE"
            ? [
                { uid: uid(), optionText: "", isCorrect: true },
                { uid: uid(), optionText: "", isCorrect: false },
              ]
            : [],
    }),
    [t],
  )

  React.useEffect(() => {
    let cancelled = false
    if (quizId) {
      quizApi
        .getForEditing(quizId)
        .then((quiz) => !cancelled && setDraft(toDraft(quiz)))
        .catch((err) => !cancelled && setLoadError(getErrorMessage(err)))
    } else {
      setDraft({
        title: lessonTitle,
        description: "",
        passingScore: 70,
        timeLimit: null,
        attemptsAllowed: -1,
        showCorrectAnswers: true,
        questions: [blankQuestion("MULTIPLE_CHOICE")],
      })
    }
    return () => {
      cancelled = true
    }
  }, [quizId, lessonTitle, blankQuestion])

  React.useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const update = (fn: (d: Draft) => Draft) => {
    setDraft((d) => (d ? fn(d) : d))
    setDirty(true)
  }
  const updateQuestion = (index: number, fn: (q: DraftQuestion) => DraftQuestion) =>
    update((d) => ({ ...d, questions: d.questions.map((q, i) => (i === index ? fn(q) : q)) }))

  const changeType = (index: number, type: QuestionType) =>
    updateQuestion(index, (q) => {
      if (type === q.questionType) return q
      if (type === "TRUE_FALSE") {
        // Reuse existing option rows so past answers keep pointing at them.
        const [first, second] = q.options
        return {
          ...q,
          questionType: type,
          options: [
            { uid: first?.uid ?? uid(), id: first?.id, optionText: t("true"), isCorrect: true },
            { uid: second?.uid ?? uid(), id: second?.id, optionText: t("false"), isCorrect: false },
          ],
        }
      }
      if (type === "MULTIPLE_CHOICE") {
        const options = q.options.length >= 2 ? q.options : blankQuestion("MULTIPLE_CHOICE").options
        return { ...q, questionType: type, options }
      }
      return { ...q, questionType: type }
    })

  const move = (index: number, delta: number) =>
    update((d) => {
      const target = index + delta
      if (target < 0 || target >= d.questions.length) return d
      const questions = [...d.questions]
      ;[questions[index], questions[target]] = [questions[target], questions[index]]
      return { ...d, questions }
    })

  const validate = (d: Draft): string[] => {
    const problems: string[] = []
    if (!d.title.trim()) problems.push(t("errors.title"))
    if (d.passingScore < 0 || d.passingScore > 100) problems.push(t("errors.passingScore"))
    if (d.questions.length === 0) problems.push(t("errors.noQuestions"))
    d.questions.forEach((q, i) => {
      const n = i + 1
      if (!q.questionText.trim()) problems.push(t("errors.questionText", { n }))
      if (q.questionType === "SHORT_ANSWER" && !(q.correctAnswer ?? "").trim()) problems.push(t("errors.shortAnswer", { n }))
      if (q.questionType !== "SHORT_ANSWER") {
        if (q.options.some((o) => !o.optionText.trim())) problems.push(t("errors.emptyOption", { n }))
        const correct = q.options.filter((o) => o.isCorrect).length
        if (q.questionType === "MULTIPLE_CHOICE" && (q.options.length < 2 || correct < 1)) {
          problems.push(t("errors.multipleChoice", { n }))
        }
        if (q.questionType === "TRUE_FALSE" && correct !== 1) problems.push(t("errors.trueFalse", { n }))
      }
    })
    return problems
  }

  const save = async () => {
    if (!draft) return
    const problems = validate(draft)
    setErrors(problems)
    if (problems.length > 0) return
    setSaving(true)
    try {
      const payload = fromDraft(draft, lessonId)
      const saved = draft.id ? await quizApi.update(draft.id, payload) : await quizApi.create(payload)
      setDraft(toDraft(saved))
      setDirty(false)
      toast({ title: t("saved") })
      if (saved.id) onSaved(saved.id)
    } catch (err) {
      toast({ variant: "destructive", title: tc("failed"), description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!draft?.id) return
    setSaving(true)
    try {
      await quizApi.remove(draft.id)
      setDirty(false)
      setConfirmDelete(false)
      toast({ title: t("deleted") })
      onDeleted()
    } catch (err) {
      toast({ variant: "destructive", title: tc("failed"), description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  if (loadError) {
    return <p className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">{loadError}</p>
  }
  if (!draft) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  const totalPoints = draft.questions.reduce((sum, q) => sum + (q.points || 0), 0)

  return (
    <div className="space-y-6">
      <Panel title={t("settings")}>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <FormField label={t("title")} htmlFor="quiz-title">
            <Input
              id="quiz-title"
              value={draft.title}
              maxLength={255}
              onChange={(e) => update((d) => ({ ...d, title: e.target.value }))}
            />
          </FormField>
          <FormField label={t("description")} htmlFor="quiz-description">
            <Input
              id="quiz-description"
              value={draft.description ?? ""}
              maxLength={1000}
              onChange={(e) => update((d) => ({ ...d, description: e.target.value }))}
            />
          </FormField>
          <div className="grid grid-cols-3 gap-3 md:col-span-2">
            <FormField label={t("passingScore")} htmlFor="quiz-pass">
              <Input
                id="quiz-pass"
                type="number"
                min={0}
                max={100}
                dir="ltr"
                value={draft.passingScore}
                onChange={(e) => update((d) => ({ ...d, passingScore: Number(e.target.value) }))}
              />
            </FormField>
            <FormField label={t("timeLimit")} htmlFor="quiz-time" hint={t("timeLimitHint")}>
              <Input
                id="quiz-time"
                type="number"
                min={1}
                dir="ltr"
                value={draft.timeLimit ?? ""}
                onChange={(e) => update((d) => ({ ...d, timeLimit: e.target.value ? Number(e.target.value) : null }))}
              />
            </FormField>
            <FormField label={t("attempts")} htmlFor="quiz-attempts" hint={t("attemptsHint")}>
              <Input
                id="quiz-attempts"
                type="number"
                min={0}
                dir="ltr"
                value={draft.attemptsAllowed > 0 ? draft.attemptsAllowed : ""}
                onChange={(e) =>
                  update((d) => ({ ...d, attemptsAllowed: Number(e.target.value) > 0 ? Number(e.target.value) : -1 }))
                }
              />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink md:col-span-2">
            <Checkbox
              checked={draft.showCorrectAnswers}
              onCheckedChange={(c) => update((d) => ({ ...d, showCorrectAnswers: c === true }))}
            />
            {t("showAnswers")}
          </label>
        </div>
      </Panel>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">
          {t("questions")} <span className="text-sm font-normal text-ink-3">{t("totals", { count: draft.questions.length, points: totalPoints })}</span>
        </h2>
      </div>

      <ol className="space-y-4">
        {draft.questions.map((q, index) => (
          <li key={q.uid} className="rounded-xl border border-line bg-surface">
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
              <span className="font-semibold text-ink">{t("questionNumber", { n: index + 1 })}</span>
              <Select
                aria-label={t("questionType")}
                value={q.questionType}
                onChange={(e) => changeType(index, e.target.value as QuestionType)}
              >
                <option value="MULTIPLE_CHOICE">{t("types.MULTIPLE_CHOICE")}</option>
                <option value="TRUE_FALSE">{t("types.TRUE_FALSE")}</option>
                <option value="SHORT_ANSWER">{t("types.SHORT_ANSWER")}</option>
              </Select>
              <label className="flex items-center gap-1.5 text-sm text-ink-2">
                {t("points")}
                <Input
                  type="number"
                  min={1}
                  dir="ltr"
                  className="h-9 w-16"
                  value={q.points}
                  onChange={(e) => updateQuestion(index, (x) => ({ ...x, points: Math.max(1, Number(e.target.value) || 1) }))}
                />
              </label>
              <div className="ms-auto flex gap-1">
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={index === 0} onClick={() => move(index, -1)} aria-label={t("moveUp")}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled={index === draft.questions.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={t("moveDown")}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label={t("duplicate")}
                  onClick={() =>
                    update((d) => {
                      const copy: DraftQuestion = {
                        ...q,
                        id: null,
                        uid: uid(),
                        options: q.options.map((o) => ({ ...o, id: null, uid: uid() })),
                      }
                      const questions = [...d.questions]
                      questions.splice(index + 1, 0, copy)
                      return { ...d, questions }
                    })
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-danger hover:bg-danger-soft hover:text-danger"
                  aria-label={t("removeQuestion")}
                  onClick={() => update((d) => ({ ...d, questions: d.questions.filter((_, i) => i !== index) }))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <Textarea
                aria-label={t("questionText")}
                placeholder={t("questionPlaceholder")}
                rows={2}
                value={q.questionText}
                onChange={(e) => updateQuestion(index, (x) => ({ ...x, questionText: e.target.value }))}
              />

              {q.questionType === "SHORT_ANSWER" ? (
                <FormField label={t("expectedAnswer")} htmlFor={`answer-${q.uid}`} hint={t("expectedAnswerHint")}>
                  <Input
                    id={`answer-${q.uid}`}
                    value={q.correctAnswer ?? ""}
                    onChange={(e) => updateQuestion(index, (x) => ({ ...x, correctAnswer: e.target.value }))}
                  />
                </FormField>
              ) : (
                <fieldset className="space-y-2">
                  <legend className="mb-1 text-sm text-ink-2">
                    {q.questionType === "TRUE_FALSE" ? t("pickCorrectOne") : t("markCorrect")}
                  </legend>
                  {q.options.map((option, optionIndex) => {
                    const setCorrect = (checked: boolean) =>
                      updateQuestion(index, (x) => ({
                        ...x,
                        options: x.options.map((o, i) =>
                          q.questionType === "TRUE_FALSE"
                            ? { ...o, isCorrect: i === optionIndex }
                            : i === optionIndex
                              ? { ...o, isCorrect: checked }
                              : o,
                        ),
                      }))
                    return (
                      <div
                        key={option.uid}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border bg-paper px-2 py-1.5",
                          option.isCorrect ? "border-success-line" : "border-line-strong",
                        )}
                      >
                        {q.questionType === "TRUE_FALSE" ? (
                          <input
                            type="radio"
                            name={`correct-${q.uid}`}
                            checked={Boolean(option.isCorrect)}
                            onChange={() => setCorrect(true)}
                            aria-label={t("correctOption", { n: optionIndex + 1 })}
                            className="h-4 w-4 accent-success"
                          />
                        ) : (
                          <Checkbox
                            checked={Boolean(option.isCorrect)}
                            onCheckedChange={(c) => setCorrect(c === true)}
                            aria-label={t("correctOption", { n: optionIndex + 1 })}
                          />
                        )}
                        <Input
                          className="h-8 border-0 shadow-none focus-visible:ring-0"
                          value={option.optionText}
                          placeholder={t("optionPlaceholder", { n: optionIndex + 1 })}
                          aria-label={t("optionPlaceholder", { n: optionIndex + 1 })}
                          onChange={(e) =>
                            updateQuestion(index, (x) => ({
                              ...x,
                              options: x.options.map((o, i) => (i === optionIndex ? { ...o, optionText: e.target.value } : o)),
                            }))
                          }
                        />
                        {q.questionType === "MULTIPLE_CHOICE" && q.options.length > 2 ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            aria-label={t("removeOption")}
                            onClick={() =>
                              updateQuestion(index, (x) => ({ ...x, options: x.options.filter((_, i) => i !== optionIndex) }))
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    )
                  })}
                  {q.questionType === "MULTIPLE_CHOICE" && q.options.length < MAX_OPTIONS ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateQuestion(index, (x) => ({
                          ...x,
                          options: [...x.options, { uid: uid(), optionText: "", isCorrect: false }],
                        }))
                      }
                    >
                      <Plus /> {t("addOption")}
                    </Button>
                  ) : null}
                </fieldset>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        {(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"] as QuestionType[]).map((type) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            onClick={() => update((d) => ({ ...d, questions: [...d.questions, blankQuestion(type)] }))}
          >
            <Plus /> {t(`add.${type}`)}
          </Button>
        ))}
      </div>

      {errors.length > 0 ? (
        <div role="alert" className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">
          <p className="font-medium">{t("fixErrors")}</p>
          <ul className="mt-1 list-disc ps-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line-strong bg-white/95 p-3 shadow-lg backdrop-blur">
        <span className="text-sm text-ink-3">{dirty ? t("unsaved") : draft.id ? t("allSaved") : t("notCreated")}</span>
        <div className="flex gap-2">
          {draft.id ? (
            <Button type="button" variant="outline" className="text-danger" onClick={() => setConfirmDelete(true)} disabled={saving}>
              <Trash2 /> {t("deleteQuiz")}
            </Button>
          ) : null}
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} {t("save")}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        destructive
        busy={saving}
        onConfirm={() => void remove()}
      />
    </div>
  )
}
