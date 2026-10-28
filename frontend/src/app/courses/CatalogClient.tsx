"use client";

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, ChevronLeft, ChevronRight, Search, SearchX, SlidersHorizontal, X } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/components/admin/ui';
import type { Page } from '@/lib/admin-api';
import { CatalogCourse, catalogApi } from '@/lib/learning-api';
import { LandingSpecialization, specializationsApi } from '@/lib/landingPage';
import { cn } from '@/lib/utils';

import { PAGE_SIZE, SORTS, catalogQueryKey, parseCatalogParams } from './catalog-query';
const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const GRID_CLASS = 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-ink-2">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-line-strong bg-paper px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30"
      >
        {children}
      </select>
    </label>
  );
}

export interface CatalogInitialData {
  /** Query the server rendered, as built by `catalogQueryKey` in catalog-query.ts. */
  key: string;
  result: Page<CatalogCourse> | null;
  categories: LandingSpecialization[];
}

function Catalog({ initial }: { initial: CatalogInitialData }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const { q, category, level, price, sort, page } = parseCatalogParams((key) => params.get(key));

  const [search, setSearch] = React.useState(q);
  const debounced = useDebouncedValue(search, 350);
  const [categories, setCategories] = React.useState<LandingSpecialization[]>(initial.categories);
  const [result, setResult] = React.useState<Page<CatalogCourse> | null>(initial.result);
  const [loading, setLoading] = React.useState(!initial.result);
  // The server already fetched the first view; skip that one request in the browser.
  const serverKey = React.useRef<string | null>(initial.result ? initial.key : null);
  const [error, setError] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  const update = React.useCallback(
    (changes: Record<string, string | number | null>, resetPage = true) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === '' || (key === 'sort' && value === 'newest')) next.delete(key);
        else next.set(key, String(value));
      }
      if (resetPage) next.delete('page');
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  // Push the debounced search box into the URL.
  React.useEffect(() => {
    if (debounced.trim() !== q) update({ q: debounced.trim() });
  }, [debounced, q, update]);

  React.useEffect(() => {
    if (initial.categories.length > 0) return;
    specializationsApi.getPublic().then(setCategories).catch(() => setCategories([]));
  }, [initial.categories.length]);

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
    setSearch('');
    router.replace(pathname, { scroll: false });
  };
  const goToPage = (next: number) => {
    update({ page: next + 1 }, false);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const categoryName = (c: LandingSpecialization) => (locale === 'ar' ? c.nameAr : c.nameEn) || c.nameEn || c.slug;

  const filters = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <FilterSelect label={t('catalog.filters.category')} value={category} onChange={(v) => update({ category: v })}>
        <option value="">{t('catalog.filters.allCategories')}</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>
            {categoryName(c)}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect label={t('catalog.filters.level')} value={level} onChange={(v) => update({ level: v })}>
        <option value="">{t('catalog.filters.allLevels')}</option>
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            {t(`courses.levels.${l}`)}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect label={t('catalog.filters.price')} value={price} onChange={(v) => update({ price: v })}>
        <option value="">{t('catalog.filters.anyPrice')}</option>
        <option value="free">{t('catalog.filters.free')}</option>
        <option value="paid">{t('catalog.filters.paid')}</option>
      </FilterSelect>
      <FilterSelect label={t('catalog.filters.sort')} value={sort} onChange={(v) => update({ sort: v })}>
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {t(`catalog.sort.${s}`)}
          </option>
        ))}
      </FilterSelect>
    </div>
  );

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <section className="relative mb-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-8 -top-16 h-56 pattern-islamic opacity-50 [mask-image:radial-gradient(60%_60%_at_50%_0%,#000,transparent)]"
        />
        <div className="relative space-y-3">
          <h1 className="text-4xl text-ink sm:text-5xl" style={{ fontFamily: 'var(--font-serif-ar)', fontWeight: 500 }}>
            {t('courses.exploreTitle')}
          </h1>
          <p className="max-w-xl text-[17px] leading-relaxed text-ink-2">{t('courses.exploreSubtitle')}</p>
        </div>
      </section>

      <div className="mb-6 space-y-4 rounded-2xl border border-line bg-surface p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('catalog.searchPlaceholder')}
              aria-label={t('catalog.searchPlaceholder')}
              className="h-11 ps-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 lg:hidden"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal /> {t('catalog.filters.toggle')}
            {activeFilters > 0 ? <span className="rounded-full bg-brand px-1.5 text-xs text-white">{activeFilters}</span> : null}
          </Button>
        </div>
        <div className={cn(showFilters ? 'block' : 'hidden', 'lg:block')}>{filters}</div>
      </div>

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
          <p className="font-medium text-ink">{t('catalog.noResults')}</p>
          <p className="mt-1 text-sm text-ink-3">{t('catalog.noResultsHint')}</p>
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
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <React.Suspense fallback={null}>
        <Catalog initial={initial} />
      </React.Suspense>
    </div>
  );
}
