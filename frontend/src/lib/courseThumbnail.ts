import { api } from "@/lib/api-axios";

export const ALLOWED_THUMBNAIL_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
export const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

export type ThumbnailValidation =
  | { ok: true }
  | { ok: false; reason: "type" | "size" };

export function validateThumbnailFile(file: File): ThumbnailValidation {
  if (!ALLOWED_THUMBNAIL_TYPES.includes(file.type.toLowerCase())) {
    return { ok: false, reason: "type" };
  }
  if (file.size > MAX_THUMBNAIL_BYTES) {
    return { ok: false, reason: "size" };
  }
  return { ok: true };
}

export async function uploadCourseThumbnail(
  file: File,
): Promise<{ url: string; objectKey: string }> {
  const form = new FormData();
  form.append("file", file);
  const response = await api.post<{ url: string; objectKey: string }>(
    "/api/courses/thumbnail",
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}
