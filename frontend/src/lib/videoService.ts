import { VideoBookmark, VideoBookmarkRequest } from '@/types/video';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class VideoBookmarkService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  static async createBookmark(
    lessonId: number,
    request: VideoBookmarkRequest
  ): Promise<VideoBookmark> {
    const response = await fetch(
      `${API_BASE_URL}/api/lessons/${lessonId}/bookmarks`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create bookmark');
    }

    return response.json();
  }

  static async getBookmarksByLesson(lessonId: number): Promise<VideoBookmark[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/lessons/${lessonId}/bookmarks`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch bookmarks');
    }

    return response.json();
  }

  static async getAllBookmarks(): Promise<VideoBookmark[]> {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch all bookmarks');
    }

    return response.json();
  }

  static async updateBookmark(
    bookmarkId: number,
    request: VideoBookmarkRequest
  ): Promise<VideoBookmark> {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks/${bookmarkId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to update bookmark');
    }

    return response.json();
  }

  static async deleteBookmark(bookmarkId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks/${bookmarkId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete bookmark');
    }
  }

  static async getBookmarkById(bookmarkId: number): Promise<VideoBookmark> {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks/${bookmarkId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bookmark');
    }

    return response.json();
  }
}

// Picture-in-Picture utilities
export class PictureInPictureService {
  static async requestPiP(videoElement: HTMLVideoElement): Promise<void> {
    if (!document.pictureInPictureEnabled) {
      throw new Error('Picture-in-Picture is not supported');
    }

    if (videoElement !== document.pictureInPictureElement) {
      await videoElement.requestPictureInPicture();
    }
  }

  static async exitPiP(): Promise<void> {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }
  }

  static isPiPActive(): boolean {
    return document.pictureInPictureElement !== null;
  }
}
