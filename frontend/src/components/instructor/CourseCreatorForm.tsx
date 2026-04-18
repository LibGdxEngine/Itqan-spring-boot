"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { CoursesService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export function CourseCreatorForm() {
  const router = useRouter();
  const t = useTranslations();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructor: "",
    price: "0",
    duration: "1",
    level: "BEGINNER",
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await CoursesService.createCourse({
        title: formData.title,
        description: formData.description || undefined,
        instructor: formData.instructor,
        price: Number(formData.price),
        duration: Number(formData.duration),
        level: formData.level,
        // Backend currently validates category as required.
        category: "GENERAL",
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
