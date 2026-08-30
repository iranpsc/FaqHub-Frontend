import CategoryContent from '@/components/CategoryContent';
import { apiService } from '@/services/api';
import { Question, PaginatedResponse } from '@/services/types';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

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

    // Metadata برای SEO
    // const metadata: Metadata = {
    //   title: `${category.name} - سوالات متداول`,
    //   description: `مشاهده سوالات متداول در دسته‌بندی ${category.name}`,
    //   keywords: `${category.name}, سوالات متداول, FAQ`,
    //   openGraph: {
    //     title: `${category.name} - سوالات متداول`,
    //     description: `مشاهده سوالات متداول در دسته‌بندی ${category.name}`,
    //     type: 'website',
    //     url: `${process.env.NEXT_PUBLIC_SITE_URL}/categories/${slug}`,
    //     images: [
    //     {
    //       url: "/main-logo.png",
    //       width: 100,
    //       height: 100,
    //       alt: "تیم متاورس رنگ",
    //     },
    //   ],
    //   },
    // };

    // Schema برای FAQPage
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": questions.map(q => ({
        "@type": "Question",
        "name": q.title,
        "url": `${process.env.NEXT_PUBLIC_SITE_URL}/questions/${q.slug}`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": q.content || "پاسخی برای این سوال هنوز ثبت نشده است."
        }
      }))
    };

    return (
      <>
        {/* Inject JSON-LD for FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />

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
