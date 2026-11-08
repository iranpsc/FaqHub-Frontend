import type { MetadataRoute } from 'next';
import { apiService } from '@/services/api';
import { SITE_URL, toIsoDate } from '@/lib/schema';

export const revalidate = 3600;

const STATIC_PATHS = ['/', '/about', '/contact', '/categories', '/tags', '/authors', '/activities'];

type PageResult<T> = {
  data?: T[];
  meta?: { last_page?: number };
};

async function collectPages<T>(
  load: (page: number) => Promise<PageResult<T>>,
  maxPages: number
): Promise<T[]> {
  try {
    const first = await load(1);
    const items = [...(first.data ?? [])];
    const lastPage = Math.min(Math.max(first.meta?.last_page ?? 1, 1), maxPages);

    if (lastPage > 1) {
      const pageNumbers = Array.from({ length: lastPage - 1 }, (_, index) => index + 2);
      const concurrency = 5;

      // Do not turn a sitemap regeneration into dozens of simultaneous API
      // requests. Batches preserve the same output while protecting the API
      // from crawler-triggered bursts.
      for (let start = 0; start < pageNumbers.length; start += concurrency) {
        const batch = pageNumbers.slice(start, start + concurrency);
        const rest = await Promise.all(
          batch.map((page) => load(page).catch(() => ({ data: [] as T[] })))
        );
        for (const page of rest) {
          items.push(...(page.data ?? []));
        }
      }
    }

    return items;
  } catch {
    return [];
  }
}

function entry(path: string, lastModified?: string | null, priority = 0.6): MetadataRoute.Sitemap[number] {
  const modified = toIsoDate(lastModified);
  return {
    url: path.startsWith('http') ? path : `${SITE_URL}${path}`,
    lastModified: modified ? new Date(modified) : new Date(),
    changeFrequency: path === '/' ? 'hourly' : 'daily',
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [questions, categories, tags, authors] = await Promise.all([
    // Sitemap generation only needs question URLs and timestamps. Request the
    // lightweight representation so large editor contents are not cached by
    // Next.js while the sitemap is built.
    collectPages((page) => apiService.getQuestionsServer({ page, summary: 1 }, false), 30),
    collectPages((page) => apiService.getCategoriesPaginatedServer({ page, per_page: 50 }, false), 10),
    collectPages((page) => apiService.getTagsPaginatedServer({ page, per_page: 50 }, false), 10),
    collectPages((page) => apiService.getAuthorsServer({ page, per_page: 50 }, false), 10),
  ]);

  const staticEntries = STATIC_PATHS.map((path) => entry(path, null, path === '/' ? 1 : 0.7));

  const questionEntries = questions.flatMap((question) =>
    question.slug
      ? [entry(`/questions/${question.slug}`, question.updated_at || question.created_at, 0.8)]
      : []
  );
  const categoryEntries = categories.flatMap((category) =>
    category.slug ? [entry(`/categories/${category.slug}`, category.updated_at, 0.6)] : []
  );
  const tagEntries = tags.flatMap((tag) =>
    tag.slug ? [entry(`/tags/${tag.slug}`, tag.updated_at, 0.5)] : []
  );
  const authorEntries = authors.flatMap((author) => {
    const segment = author.username || author.id;
    return segment ? [entry(`/authors/${segment}`, author.created_at, 0.5)] : [];
  });

  return [...staticEntries, ...questionEntries, ...categoryEntries, ...tagEntries, ...authorEntries];
}
