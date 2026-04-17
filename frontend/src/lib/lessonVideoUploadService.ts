import api from "@/lib/api-axios";
import { LessonResponse } from "@/lib/api";

interface LessonVideoMultipartInitiateRequest {
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
}

interface LessonVideoMultipartInitiateResponse {
  uploadId: string;
  objectKey: string;
  fileSizeBytes: number;
  partSizeBytes: number;
  partCount: number;
  expiresAt: string;
  partUrls: Array<{
    partNumber: number;
    url: string;
  }>;
}

interface LessonVideoMultipartCompleteRequest {
  uploadId: string;
  objectKey: string;
  parts: Array<{
    partNumber: number;
    etag: string;
  }>;
}

interface LessonVideoPlaybackResponse {
  url: string;
  expiresAt: string | null;
}

export async function initiateLessonVideoMultipartUpload(
  lessonId: number,
  request: LessonVideoMultipartInitiateRequest
): Promise<LessonVideoMultipartInitiateResponse> {
  const response = await api.post<LessonVideoMultipartInitiateResponse>(
    `/api/lessons/${lessonId}/video/multipart/initiate`,
    request
  );
  return response.data;
}

export async function completeLessonVideoMultipartUpload(
  lessonId: number,
  request: LessonVideoMultipartCompleteRequest
): Promise<LessonResponse> {
  const response = await api.post<LessonResponse>(
    `/api/lessons/${lessonId}/video/multipart/complete`,
    request
  );
  return response.data;
}

export async function abortLessonVideoMultipartUpload(
  lessonId: number,
  uploadId: string,
  objectKey: string
): Promise<void> {
  await api.post(`/api/lessons/${lessonId}/video/multipart/abort`, {
    uploadId,
    objectKey,
  });
}

export async function uploadLessonVideoFile(
  lessonId: number,
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<LessonResponse> {
  const initiateResponse = await initiateLessonVideoMultipartUpload(lessonId, {
    filename: file.name,
    mimeType: file.type || "video/mp4",
    fileSizeBytes: file.size,
  });

  const sortedPartUrls = [...initiateResponse.partUrls].sort(
    (a, b) => a.partNumber - b.partNumber
  );

  const completedParts: Array<{ partNumber: number; etag: string }> = [];
  let uploadedBytes = 0;
  onProgress?.(0);

  try {
    for (const part of sortedPartUrls) {
      const start = (part.partNumber - 1) * initiateResponse.partSizeBytes;
      const end = Math.min(start + initiateResponse.partSizeBytes, file.size);
      const chunk = file.slice(start, end);

      const uploadResponse = await fetch(part.url, {
        method: "PUT",
        body: chunk,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload video chunk ${part.partNumber}`);
      }

      const etag = uploadResponse.headers.get("ETag");
      if (!etag) {
        throw new Error(`Missing ETag for uploaded chunk ${part.partNumber}`);
      }

      completedParts.push({
        partNumber: part.partNumber,
        etag,
      });

      uploadedBytes += chunk.size;
      const progress = Math.min(100, Math.round((uploadedBytes / file.size) * 100));
      onProgress?.(progress);
    }
  } catch (error) {
    try {
      await abortLessonVideoMultipartUpload(
        lessonId,
        initiateResponse.uploadId,
        initiateResponse.objectKey
      );
    } catch {
      // Best effort cleanup; original error is more relevant to surface.
    }
    throw error;
  }

  const completedLesson = await completeLessonVideoMultipartUpload(lessonId, {
    uploadId: initiateResponse.uploadId,
    objectKey: initiateResponse.objectKey,
    parts: completedParts,
  });
  onProgress?.(100);
  return completedLesson;
}

export async function getLessonVideoPlaybackUrl(
  lessonId: number
): Promise<LessonVideoPlaybackResponse> {
  const response = await api.get<LessonVideoPlaybackResponse>(
    `/api/lessons/${lessonId}/video/playback-url`
  );
  return response.data;
}

export async function reorderModuleLessons(
  moduleId: number,
  lessonIds: number[]
): Promise<LessonResponse[]> {
  const response = await api.patch<LessonResponse[]>(
    `/api/modules/${moduleId}/lessons/reorder`,
    { lessonIds }
  );
  return response.data;
}
