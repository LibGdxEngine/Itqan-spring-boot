'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Trash2, Edit, Clock } from 'lucide-react';
import { BookmarkPanelProps } from '@/types/video';

export function BookmarkPanel({
  bookmarks,
  onSeek,
  onEdit,
  onDelete,
  onCreate,
}: BookmarkPanelProps) {
  const t = useTranslations('lesson.player');
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-800 p-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">{t('bookmarks')}</h3>
        <button
          onClick={onCreate}
          className="bg-brand hover:bg-brand-hover text-on-night px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          {t('addBookmark')}
        </button>
      </div>

      {bookmarks.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          {t('noBookmarks')}
        </p>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition group"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  onClick={() => onSeek(bookmark.timestamp)}
                  className="flex-1 text-start"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-coral" />
                    <span className="text-coral font-mono text-sm">
                      {formatTime(bookmark.timestamp)}
                    </span>
                  </div>
                  {bookmark.note && (
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {bookmark.note}
                    </p>
                  )}
                  {!bookmark.note && (
                    <p className="text-gray-400 text-sm italic">{t('noNote')}</p>
                  )}
                </button>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => onEdit(bookmark)}
                    className="p-2 hover:bg-gray-600 rounded-lg transition text-gray-300 hover:text-white"
                    title={t('editBookmark')}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(bookmark.id)}
                    className="p-2 hover:bg-red-600 rounded-lg transition text-gray-300 hover:text-white"
                    title={t('deleteBookmark')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
