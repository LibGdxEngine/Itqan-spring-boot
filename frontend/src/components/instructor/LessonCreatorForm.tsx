"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { LessonRequest, LessonsService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { uploadLessonVideoFile } from "@/lib/lessonVideoUploadService";

interface LessonCreatorFormProps {
  moduleId: number;
  defaultOrderIndex?: number;
  onSuccess?: () => void;
}

export function LessonCreatorForm({
  moduleId,
  defaultOrderIndex = 1,
  onSuccess,
}: LessonCreatorFormProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    manualVideoUrl: "",
    duration: "10",
    orderIndex: String(defaultOrderIndex),
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const createdLesson = await LessonsService.createLesson({
        moduleId,
        title: formData.title,
        description: formData.content || undefined,
        content: formData.content || undefined,
        type: LessonRequest.type.VIDEO,
        videoUrl: videoFile ? undefined : (formData.manualVideoUrl || undefined),
        duration: Number(formData.duration),
        orderIndex: Number(formData.orderIndex),
      });

      if (videoFile && createdLesson.id) {
        await uploadLessonVideoFile(createdLesson.id, videoFile, (progressPercent) => {
          setUploadProgress(progressPercent);
        });
      }

      toast({
        title: t("instructor.lessonCreated") || "Lesson saved",
        description: videoFile
          ? "Lesson created and video uploaded successfully."
          : "The lesson has been added successfully.",
      });

      setFormData({
        title: "",
        content: "",
        manualVideoUrl: "",
        duration: "10",
        orderIndex: String(defaultOrderIndex),
      });
      setVideoFile(null);
      setUploadProgress(0);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create lesson", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: videoFile
          ? "Lesson creation or video upload failed."
          : "Failed to add lesson.",
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
        <label className="text-sm font-medium">Video File (up to 5 GB)</label>
        <Input
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("courses.videoUrl") || "Manual Video URL (optional)"}</label>
        <Input
          type="url"
          value={formData.manualVideoUrl}
          onChange={(e) => setFormData((prev) => ({ ...prev, manualVideoUrl: e.target.value }))}
          placeholder="https://example.com/video.mp4"
          disabled={Boolean(videoFile)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      {loading && videoFile && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Upload Progress</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-sky-600 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("instructor.addLesson") || "Add Lesson"}
      </Button>
    </form>
  );
}
