import Link from 'next/link';
import { Metadata } from 'next';
import { ContentArea } from '@/components/ContentArea';
import { HomeSidebar } from '@/components/HomeSidebar';
import { JsonLd } from '@/components/JsonLd';
import { BaseAlert } from '@/components/ui/BaseAlert';
import { PaginationHandler } from '@/components/PaginationHandler';
import { apiService } from '@/services/api';
import { buildCollectionPage, SITE_URL } from '@/lib/schema';
import { Tag, PaginatedResponse } from '@/services/types';

export const revalidate = 180; // Revalidate every 3 minutes

// Metadata for SEO
export const metadata: Metadata = {
  title: 'برچسب‌ها - سوالات متداول',
  description: 'مشاهده تمام برچسب‌های موجود در سیستم سوالات متداول',
  keywords: 'برچسب, تگ, سوالات متداول, FAQ',
  alternates: { canonical: `${SITE_URL}/tags` },
  openGraph: {
    title: 'برچسب‌ها - سوالات متداول',
    description: 'مشاهده تمام برچسب‌های موجود در سیستم سوالات متداول',
    type: 'website',
    url: `${SITE_URL}/tags`,
    images: [
        {
          url: "/main-logo.png",
          width: 200,
          height: 200,
          alt: "تیم متاورس رنگ",
        },
      ],
  },
};

export const dynamic = 'force-dynamic';

interface TagsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function TagsContent({ tags, pagination, error }: { tags: Tag[]; pagination: PaginatedResponse<Tag>['meta']; error?: string; }) {
  const schema = buildCollectionPage({
    url: `${SITE_URL}/tags`,
    name: 'برچسب‌های سایت',
    description: 'تمام برچسب‌های موجود در سیستم سوالات متداول',
    items: tags.map((tag) => ({
      name: tag.name,
      url: tag.slug ? `${SITE_URL}/tags/${tag.slug}` : undefined,
    })),
  });

  return (
    <>
      <JsonLd data={schema} />

      <ContentArea
        layout="with-sidebar"
        showSidebar={true}
        mainWidth="3/4"
        sidebarWidth="1/4"
        main={
          <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">برچسب‌ها</h1>
              <div className="mt-2 sm:mt-0 text-sm text-gray-600 dark:text-gray-400">
                {pagination && <>مجموع {pagination.total} برچسب</>}
              </div>
            </div>

            {/* Error State */}
            {error && <BaseAlert variant="error" message={error} />}

            {/* Tags Grid */}
            {!error && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tags/${tag.slug}`}
                      className="block bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-blue-100 dark:border-gray-700 group"
                    >
                      <div className="p-6 flex flex-col h-full">
                        <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200 mb-2 group-hover:text-blue-700 transition-colors duration-200">
                          {tag.name}
                        </h2>
                        <div className="flex-1"></div>
                        <div className="flex flex-col gap-2 mt-4">
                          {tag.questions_count > 0 && (
                            <div className="flex items-center  text-blue-600 dark:text-blue-300">
                              <svg className="w-5 h-5 mt-[-3px] ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              {tag.questions_count} سوال
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                <PaginationHandler pagination={pagination} currentPage={pagination?.current_page || 1} />

                {/* Empty State */}
                {tags.length === 0 && !error && (
                  <div className="text-center py-16">
                    <h2 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">برچسبی یافت نشد</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">هنوز برچسبی ایجاد نشده است.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        }
        sidebar={<HomeSidebar />}
      />
    </>
  );
}

export default async function TagsPage({ searchParams }: TagsPageProps) {
  try {
    const params = await searchParams;
    const page = parseInt(params.page as string) || 1;

    const response = await apiService.getTagsPaginatedServer({
      page,
      per_page: 12
    });

    return (
      <TagsContent
        tags={response.data || []}
        pagination={response.meta || {
          current_page: 1,
          last_page: 1,
          per_page: 12,
          total: 0
        }}
      />
    );
  } catch (error) {
    console.error('Failed to fetch tags in server component:', error);

    return (
      <TagsContent
        tags={[]}
        pagination={{
          current_page: 1,
          last_page: 1,
          per_page: 12,
          total: 0
        }}
        error={error instanceof Error ? error.message : 'خطا در بارگذاری برچسب‌ها'}
      />
    );
  }
}
