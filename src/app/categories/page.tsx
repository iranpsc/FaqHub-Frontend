import Link from 'next/link';
import { Metadata } from 'next';
import { ContentArea } from '@/components/ContentArea';
import { HomeSidebar } from '@/components/HomeSidebar';
import { JsonLd } from '@/components/JsonLd';
import { BaseAlert } from '@/components/ui/BaseAlert';
import { PaginationHandler } from '@/components/PaginationHandler';
import { apiService } from '@/services/api';
import { buildCollectionPage, SITE_URL } from '@/lib/schema';

export const revalidate = 180; // Revalidate every 3 minutes

// ✅ SEO Metadata
export const metadata: Metadata = {
  title: 'دسته‌بندی‌ها - سوالات متداول',
  description: 'مشاهده تمام دسته‌بندی‌های موجود در سیستم سوالات متداول',
  keywords: ['دسته‌بندی', 'کتگوری', 'سوالات متداول', 'FAQ'],
  alternates: { canonical: `${SITE_URL}/categories` },
  openGraph: {
    title: 'دسته‌بندی‌ها - سوالات متداول',
    description: 'مشاهده تمام دسته‌بندی‌های موجود در سیستم سوالات متداول',
    type: 'website',
    url: `${SITE_URL}/categories`,
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

interface CategoriesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// ✅ Server Component اصلی
export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  try {
    const params = await searchParams;
    const page = parseInt(params.page as string) || 1;

    // دریافت داده از API
    const response = await apiService.getCategoriesPaginatedServer({
      page,
      per_page: 12,
    });

    const categories = response.data || [];
    const pagination = response.meta || {
      current_page: 1,
      last_page: 1,
      per_page: 12,
      total: 0,
    };

    const schemaData = buildCollectionPage({
      url: `${SITE_URL}/categories`,
      name: 'لیست دسته‌بندی‌های سوالات متداول',
      description: 'تمام دسته‌بندی‌های موجود در سیستم سوالات متداول',
      items: categories.slice(0, 20).map((category) => ({
        name: category.name,
        url: category.slug ? `${SITE_URL}/categories/${category.slug}` : undefined,
      })),
    });

    return (
      <>
        <JsonLd data={schemaData} />

        <ContentArea
          layout="with-sidebar"
          showSidebar={true}
          mainWidth="3/4"
          sidebarWidth="1/4"
          main={
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">دسته‌بندی‌ها</h1>
                <div className="mt-2 sm:mt-0 text-sm text-gray-600 dark:text-gray-400">
                  {pagination && <>مجموع {pagination.total} دسته‌بندی</>}
                </div>
              </div>

              {/* Error State */}
              {!categories.length && (
                <BaseAlert variant="error" message="هیچ دسته‌بندی‌ای یافت نشد." />
              )}

              {/* Categories Grid */}
              {categories.length > 0 && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="block bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-blue-100 dark:border-gray-700 group"
                      >
                        <div className="p-6 flex flex-col h-full">
                          <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200 mb-2 group-hover:text-blue-700 transition-colors duration-200">
                            {category.name}
                          </h2>
                          <div className="flex-1"></div>
                          <div className="flex flex-col gap-2 mt-4">
                            {category.questions_count && category.questions_count > 0 && (
                              <div className="flex items-center text-sm text-green-600 dark:text-green-300">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2z"
                                  />
                                </svg>
                                {category.questions_count} سوال
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination */}
                  <PaginationHandler
                    pagination={pagination}
                    currentPage={pagination?.current_page || 1}
                  />
                </div>
              )}

              {/* Empty State */}
              {categories.length === 0 && (
                <div className="text-center py-16">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <h2 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    دسته‌بندی‌ای یافت نشد
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    هنوز دسته‌بندی‌ای ایجاد نشده است.
                  </p>
                </div>
              )}
            </div>
          }
          sidebar={<HomeSidebar />}
        />
      </>
    );
  } catch (error) {
    console.error('Failed to fetch categories in server component:', error);

    return (
      <ContentArea
        layout="with-sidebar"
        showSidebar={true}
        mainWidth="3/4"
        sidebarWidth="1/4"
        main={
          <BaseAlert
            variant="error"
            message={error instanceof Error ? error.message : 'خطا در بارگذاری دسته‌بندی‌ها'}
          />
        }
        sidebar={<HomeSidebar />}
      />
    );
  }
}
