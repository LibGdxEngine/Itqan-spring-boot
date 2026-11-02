"use client";

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, ChevronLeft, ChevronRight, SearchX, X } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/button';
import type { Page } from '@/lib/admin-api';
import { CatalogCourse, catalogApi } from '@/lib/learning-api';
import { cn } from '@/lib/utils';

import { PAGE_SIZE, catalogQueryKey, parseCatalogParams } from './catalog-query';

const GRID_CLASS = 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

export interface CatalogInitialData {
  /** Query the server rendered, as built by `catalogQueryKey` in catalog-query.ts. */
  key: string;
  result: Page<CatalogCourse> | null;
}

function Catalog({ initial }: { initial: CatalogInitialData }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const { q, category, level, price, sort, page } = parseCatalogParams((key) => params.get(key));

  const [result, setResult] = React.useState<Page<CatalogCourse> | null>(initial.result);
  const [loading, setLoading] = React.useState(!initial.result);
  // The server already fetched the first view; skip that one request in the browser.
  const serverKey = React.useRef<string | null>(initial.result ? initial.key : null);
  const [error, setError] = React.useState(false);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  const setPage = (next: number) => {
    const query = new URLSearchParams(params.toString());
    if (next > 1) query.set('page', String(next));
    else query.delete('page');
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  React.useEffect(() => {
    const key = catalogQueryKey({ q, category, level, price, sort, page });
    if (serverKey.current === key) {
      serverKey.current = null;
      return;
    }
    serverKey.current = null;
    let cancelled = false;
    setLoading(true);
    catalogApi
      .search({ q, category, level, price, sort, page, size: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setError(false);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, category, level, price, sort, page]);

  const activeFilters = [category, level, price].filter(Boolean).length + (q ? 1 : 0);
  const clearAll = () => {
    router.replace(pathname, { scroll: false });
  };
  const goToPage = (next: number) => {
    setPage(next + 1);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <section className="relative mb-8">
        {/* Bleeds only as far as the page gutter so it never widens the document on phones. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-4 -top-16 h-56 pattern-islamic opacity-50 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000,transparent)] sm:-inset-x-6 lg:-inset-x-8"
        />
        <div className="relative space-y-3">
          <h1 className="text-4xl text-ink sm:text-5xl" style={{ fontFamily: 'var(--font-serif-ar)', fontWeight: 500 }}>
            {t('courses.exploreTitle')}
          </h1>
          <p className="max-w-xl text-[17px] leading-relaxed text-ink-2">{t('courses.exploreSubtitle')}</p>
        </div>
      </section>

      <div ref={resultsRef} className="mb-4 flex min-h-9 scroll-mt-24 flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-2" role="status" aria-live="polite">
          {result && !loading ? t('catalog.resultCount', { count: result.totalElements }) : null}
        </p>
        {activeFilters > 0 ? (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X /> {t('catalog.clearFilters')}
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-16 text-center">
          <AlertTriangle className="mb-3 h-8 w-8 text-brand" />
          <p className="text-ink-2">{t('courses.loadFailed')}</p>
        </div>
      ) : !result || (loading && result.content.length === 0) ? (
        <div className={GRID_CLASS} aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[360px] animate-pulse rounded-2xl bg-subtle" />
          ))}
        </div>
      ) : result.content.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-16 text-center">
          <SearchX className="mb-3 h-8 w-8 text-ink-3" />
          <p className="font-medium text-ink">{t(activeFilters > 0 ? 'catalog.noResults' : 'catalog.empty')}</p>
          <p className="mt-1 text-sm text-ink-3">{t(activeFilters > 0 ? 'catalog.noResultsHint' : 'catalog.emptyHint')}</p>
          {activeFilters > 0 ? (
            <Button className="mt-4" variant="outline" onClick={clearAll}>
              {t('catalog.clearFilters')}
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className={cn(GRID_CLASS, loading && 'opacity-60 transition-opacity')}>
            {result.content.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          {result.totalPages > 1 ? (
            <nav aria-label={t('catalog.pagination')} className="mt-10 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => goToPage(page - 1)} aria-label={t('catalog.previous')}>
                <ChevronLeft className="rtl:rotate-180" />
              </Button>
              {Array.from({ length: result.totalPages }, (_, i) => i)
                .filter((i) => i === 0 || i === result.totalPages - 1 || Math.abs(i - page) <= 1)
                .map((i, index, list) => (
                  <React.Fragment key={i}>
                    {index > 0 && i - list[index - 1] > 1 ? <span className="px-1 text-ink-3">…</span> : null}
                    <Button
                      variant={i === page ? 'default' : 'outline'}
                      size="sm"
                      aria-current={i === page ? 'page' : undefined}
                      onClick={() => goToPage(i)}
                    >
                      {(i + 1).toLocaleString(locale)}
                    </Button>
                  </React.Fragment>
                ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= result.totalPages}
                onClick={() => goToPage(page + 1)}
                aria-label={t('catalog.next')}
              >
                <ChevronRight className="rtl:rotate-180" />
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </main>
  );
}

export function CatalogPage({ initial }: { initial: CatalogInitialData }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-canvas">
      <Navbar />
      <React.Suspense fallback={null}>
        <Catalog initial={initial} />
      </React.Suspense>
    </div>
  );
}
