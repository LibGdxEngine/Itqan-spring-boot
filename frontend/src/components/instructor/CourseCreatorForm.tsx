"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { CoursesService } from "@/lib/api";
import {
  uploadCourseThumbnail,
  validateThumbnailFile,
} from "@/lib/courseThumbnail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export function CourseCreatorForm() {
  const router = useRouter();
  const t = useTranslations();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructor: "",
    price: "0",
    duration: "1",
    level: "BEGINNER",
  });

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  const onPickThumbnail = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validation = validateThumbnailFile(file);
    if (!validation.ok) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          validation.reason === "size"
            ? t("instructor.thumbnailTooLarge") ||
              "Image is larger than 5 MB."
            : t("instructor.thumbnailUnsupportedType") ||
              "Use JPEG, PNG, or WebP.",
      });
      return;
    }

    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const clearThumbnail = () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      let thumbnailUrl: string | undefined;
      if (thumbnailFile) {
        try {
          const uploaded = await uploadCourseThumbnail(thumbnailFile);
          thumbnailUrl = uploaded.url;
        } catch (uploadError) {
          console.error("Failed to upload thumbnail", uploadError);
          toast({
            variant: "destructive",
            title: "Error",
            description:
              t("instructor.thumbnailUploadFailed") ||
              "Couldn't upload the thumbnail. Try a different image.",
          });
          setLoading(false);
          return;
        }
      }

      await CoursesService.createCourse({
        title: formData.title,
        description: formData.description || undefined,
        instructor: formData.instructor,
        price: Number(formData.price),
        duration: Number(formData.duration),
        level: formData.level,
        // Backend currently validates category as required.
        category: "GENERAL",
        thumbnailUrl,
      });

      toast({
        title: t("instructor.courseCreated") || "Course created",
        description:
          t("instructor.courseCreatedDesc") ||
          "Your new course has been created successfully.",
      });

      setFormData({
        title: "",
        description: "",
        instructor: "",
        price: "0",
        duration: "1",
        level: "BEGINNER",
      });
      clearThumbnail();
      router.refresh();
    } catch (error) {
      console.error("Failed to create course", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create course. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("instructor.thumbnail") || "Course thumbnail"}
        </label>
        {thumbnailPreview ? (
          <div className="relative overflow-hidden rounded-md border border-[#e8e6dc] bg-[#f0eee6]">
            <img
              src={thumbnailPreview}
              alt=""
              className="aspect-video w-full object-cover"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute right-2 top-2 gap-1"
              onClick={clearThumbnail}
            >
              <X className="h-3 w-3" />
              {t("instructor.thumbnailRemove") || "Remove"}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#e8e6dc] bg-[#faf9f5] text-sm text-[#87867f] transition-colors hover:border-[#c96442] hover:text-[#c96442]"
          >
            <ImagePlus className="h-6 w-6" />
            <span>{t("instructor.thumbnailPickFile") || "Choose image"}</span>
            <span className="text-xs">
              {t("instructor.thumbnailHint") ||
                "JPEG, PNG, or WebP. Max 5 MB."}
            </span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onPickThumbnail}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("courses.title") || "Course Title"}</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Introduction to..."
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("courses.description") || "Description"}</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Course description..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("courses.instructor") || "Instructor Name"}</label>
          <Input
            value={formData.instructor}
            onChange={(e) => setFormData((prev) => ({ ...prev, instructor: e.target.value }))}
            placeholder="Instructor Name"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("courses.level") || "Level"}</label>
          <select
            className="flex h-10 w-full rounded-md border border-[#e8e6dc] bg-[#faf9f5] px-3 py-2 text-sm"
            value={formData.level}
            onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
          >
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("courses.price") || "Price ($)"}</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("courses.duration") || "Duration (hours)"}</label>
          <Input
            type="number"
            min="1"
            value={formData.duration}
            onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("instructor.createCourse") || "Create Course"}
      </Button>
    </form>
  );
}
