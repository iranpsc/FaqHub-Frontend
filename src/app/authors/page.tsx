import { Suspense } from 'react';
import { apiService } from '@/services/api';
import { AuthorsPageContent } from './AuthorsPageContent';
import { JsonLd } from '@/components/JsonLd';
import { Metadata } from 'next';
import { buildCollectionPage, SITE_URL } from '@/lib/schema';
import { User, PaginatedResponse } from '@/services/types';

export const revalidate = 120; // Revalidate every 2 minutes

export const metadata: Metadata = {
  title: 'فعالان انجمن - نویسندگان',
  description: 'لیست تمام نویسندگان فعال در انجمن سوالات متداول',
  keywords: 'نویسنده, کاربران, فعالان انجمن, سوالات متداول',

  alternates: {
    canonical: 'https://faqhub.ir/authors',
  },
  openGraph: {
    title: 'فعالان انجمن - نویسندگان',
    description: 'لیست تمام نویسندگان فعال در انجمن سوالات متداول',
    type: 'website',
    url: 'https://faqhub.ir/authors',
    siteName: 'FAQ Hub',
    images: [
      {
        url: "/main-logo.png",
        width: 200,
        height: 200,
        alt: "تیم متاورس رنگ",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'فعالان انجمن - نویسندگان',
    description: 'لیست تمام نویسندگان فعال در انجمن سوالات متداول',
    site: '@FAQHub', // اگر اکانت توییتر دارید
  },
};


export const dynamic = 'force-dynamic';

interface AuthorsPageProps {
  searchParams: Promise<{ page?: string; search?: string; sort_by?: string; sort_order?: string }>;
}

export default async function AuthorsPage({ searchParams }: AuthorsPageProps) {
  const params = await searchParams;

  const page = parseInt(params.page || '1');
  const search = params.search || '';
  const sortBy = params.sort_by || 'score';
  const sortOrder = params.sort_order || 'desc';

  try {
    const authorsParams: Record<string, string | number> = {
      page,
      per_page: 20,
      sort_by: sortBy,
      sort_order: sortOrder,
    };
    if (search.trim()) {
      authorsParams.search = search.trim();
    }

    const response = await apiService.getAuthorsServer(authorsParams);
    const authors: User[] = response.data || [];
    const pagination: PaginatedResponse<User>['meta'] = response.meta || {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0,
    };

    const schema = buildCollectionPage({
      url: `${SITE_URL}/authors`,
      name: 'فعالان انجمن',
      description: 'لیست تمام نویسندگان فعال در انجمن سوالات متداول',
      items: authors.slice(0, 20).map((author) => ({
        name: author.name,
        url: `${SITE_URL}/authors/${author.username ?? author.id}`,
      })),
    });

    return (
      <>
        <JsonLd data={schema} />

        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <p>در حال بارگذاری...</p>
          </div>
        }>
          <AuthorsPageContent
            initialAuthors={authors}
            initialPagination={pagination}
            initialSearchQuery={search}
            initialSortBy={sortBy}
            initialSortOrder={sortOrder}
            initialPage={page}
          />
        </Suspense>
      </>
    );
  } catch (error) {
    console.error('Error fetching authors:', error);

    return (
      <AuthorsPageContent
        initialAuthors={[]}
        initialPagination={{
          current_page: 1,
          last_page: 1,
          per_page: 20,
          total: 0,
        }}
        initialSearchQuery={search}
        initialSortBy={sortBy}
        initialSortOrder={sortOrder}
        initialPage={page}
      />
    );
  }
}
