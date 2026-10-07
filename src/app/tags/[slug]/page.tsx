import TagContent from '@/components/TagContent';
import { JsonLd } from '@/components/JsonLd';
import { apiService } from '@/services/api';
import { buildCollectionPage, SITE_URL } from '@/lib/schema';
import { Metadata } from 'next';

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

// تابع برای متادیتای داینامیک
export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  try {
    const tagData = await apiService.getTagQuestionsServer(slug, 1);
    const tag = tagData.tag;
    const questions = tagData.data || [];

    const title = tag ? `سوالات برچسب "${tag.name}" - سوالات متداول` : `برچسب "${slug}" - سوالات متداول`;
    const description = tag
      ? `مشاهده ${questions.length} سوال مرتبط با برچسب "${tag.name}" در سیستم سوالات متداول.`
      : `مشاهده سوالات مرتبط با برچسب "${slug}" در سیستم سوالات متداول.`;
    const url = `${SITE_URL}/tags/${slug}`;

    return {
      title,
      description,
      alternates: { canonical: url },
      keywords: `${tag?.name || slug}, برچسب, سوالات متداول, FAQ`,
      openGraph: { title, description, type: 'website', url,
        images: [
        {
          url: "/main-logo.png",
          width: 200,
          height: 200,
          alt: "تیم متاورس رنگ",
        },
      ],
      },
      twitter: { card: 'summary_large_image', title, description },
      
    };
  } catch {
    return {
      title: 'سوالات برچسب',
      description: 'مشاهده سوالات برچسب‌ها در سیستم سوالات متداول',
      alternates: { canonical: `${SITE_URL}/tags/${slug}` },
      keywords: 'برچسب, تگ, سوالات متداول, FAQ',
    };
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  try {
    const tagData = await apiService.getTagQuestionsServer(slug, 1);
    const questions = tagData.data || [];
    const tag = tagData.tag || null;
    const pagination = tagData.meta || null;

    const tagName = tag?.name || slug;
    const schema = buildCollectionPage({
      url: `${SITE_URL}/tags/${slug}`,
      name: `سوالات برچسب ${tagName}`,
      description: `سوالات مرتبط با برچسب ${tagName}`,
      items: questions.map((question) => ({
        name: question.title,
        url: question.slug ? `${SITE_URL}/questions/${question.slug}` : undefined,
      })),
    });

    return (
      <>
        <JsonLd data={schema} />

        <TagContent
          slug={slug}
          initialQuestions={questions}
          initialTag={tag}
          initialPagination={pagination}
        />
      </>
    );
  } catch {
    return (
      <TagContent 
        slug={slug}
        initialQuestions={[]}
        initialTag={null}
        initialPagination={null}
      />
    );
  }
}
