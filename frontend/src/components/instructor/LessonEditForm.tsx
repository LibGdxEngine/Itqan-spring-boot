"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { LessonRequest, LessonResponse, LessonsService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface LessonEditFormProps {
  lesson: LessonResponse;
  moduleId: number;
  onSuccess?: () => void;
}

export function LessonEditForm({ lesson, moduleId, onSuccess }: LessonEditFormProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: lesson.title ?? "",
    content: lesson.content ?? "",
    manualVideoUrl: lesson.videoUrl ?? "",
    duration: lesson.duration != null ? String(lesson.duration) : "10",
    orderIndex: lesson.orderIndex != null ? String(lesson.orderIndex) : "1",
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (lesson.id == null) return;

    setLoading(true);
    try {
      await LessonsService.updateLesson(lesson.id, {
        moduleId,
        title: formData.title,
        description: formData.content || undefined,
        content: formData.content || undefined,
        type: (lesson.type as unknown as LessonRequest.type) ?? LessonRequest.type.VIDEO,
        videoUrl: formData.manualVideoUrl || undefined,
        duration: Number(formData.duration),
        orderIndex: Number(formData.orderIndex),
        isFree: lesson.isFree,
        active: lesson.active,
      });

      toast({
        title: t("instructor.lessonUpdated") || "Lesson updated",
        description: "The lesson has been updated successfully.",
      });

      onSuccess?.();
    } catch (error) {
      console.error("Failed to update lesson", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update lesson.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("courses.lessonTitle") || "Lesson Title"}</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Introduction to..."
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("courses.videoUrl") || "Manual Video URL (optional)"}</label>
        <Input
          type="url"
          value={formData.manualVideoUrl}
          onChange={(e) => setFormData((prev) => ({ ...prev, manualVideoUrl: e.target.value }))}
          placeholder="https://example.com/video.mp4"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("courses.durationMinutes") || "Duration (min)"}</label>
          <Input
            type="number"
            min="0"
            value={formData.duration}
            onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("courses.order") || "Order"}</label>
          <Input
            type="number"
            min="1"
            value={formData.orderIndex}
            onChange={(e) => setFormData((prev) => ({ ...prev, orderIndex: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("courses.content") || "Content / Description"}</label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
          placeholder="Lesson content..."
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("instructor.saveChanges") || "Save Changes"}
      </Button>
    </form>
  );
}
