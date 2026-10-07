import { Metadata } from 'next';
import CategoryContent from '@/components/CategoryContent';
import { JsonLd } from '@/components/JsonLd';
import { apiService } from '@/services/api';
import { buildCollectionPage, SITE_URL } from '@/lib/schema';
import { Question, PaginatedResponse } from '@/services/types';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const url = `${SITE_URL}/categories/${slug}`;

  try {
    const category = await apiService.getCategoryServer(slug);
    const title = `${category.name} - سوالات متداول`;
    const description = category.description?.trim()
      || `مشاهده سوالات متداول در دسته‌بندی ${category.name}`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        type: 'website',
        url,
      },
    };
  } catch {
    return {
      title: 'دسته‌بندی',
      description: 'مشاهده سوالات دسته‌بندی در سیستم سوالات متداول',
      alternates: { canonical: url },
    };
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  try {
    // Fetch category info
    const category = await apiService.getCategoryServer(slug);

    // Fetch questions
    let questions: Question[] = [];
    let pagination: PaginatedResponse<Question>['meta'] | null = null;

    try {
      const categoryData = await apiService.getCategoryQuestionsServer(slug, 1);
      questions = categoryData.data || [];
      pagination = categoryData.meta || null;
    } catch {
      // Use empty questions; meta may still be set from getCategoryServer
    }

    const schema = buildCollectionPage({
      url: `${SITE_URL}/categories/${slug}`,
      name: category?.name ? `سوالات ${category.name}` : 'سوالات دسته‌بندی',
      description: category?.description || (category?.name
        ? `مشاهده سوالات متداول در دسته‌بندی ${category.name}`
        : undefined),
      items: questions.map((question) => ({
        name: question.title,
        url: question.slug ? `${SITE_URL}/questions/${question.slug}` : undefined,
      })),
    });

    return (
      <>
        <JsonLd data={schema} />

        <CategoryContent
          slug={slug}
          initialCategory={category}
          initialQuestions={questions}
          initialPagination={pagination}
        />
      </>
    );
  } catch {
    return (
      <CategoryContent
        slug={slug}
        initialCategory={null}
        initialQuestions={[]}
        initialPagination={null}
      />
    );
  }
}
