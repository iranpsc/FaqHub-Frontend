import HomeContent from '@/components/HomeContent';
import { JsonLd } from '@/components/JsonLd';
import { apiService } from '@/services/api';
import { buildListItems, SITE_URL, websiteSchema, type JsonLdNode } from '@/lib/schema';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export async function generateMetadata() {
  const title = "انجمن حم - بزرگترین انجمن پرسش و پاسخ ایران";
  const description = "پرسش و پاسخ درباره موضوعات مختلف در بزرگترین انجمن ایران. سوالات خود را بپرسید و پاسخ‌ها را مشاهده کنید.";
  const url = "https://faqhub.ir";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "انجمن حم",
      type: "website",
      images: [
        { url: "/main-logo.png", width: 200, height: 200, alt: "تیم متاورس رنگ" },
      ],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HomePage() {
  try {
    const [questionsData, activeUsers] = await Promise.all([
      apiService.getQuestionsServer(),
      apiService.getActiveUsersServer(12)
    ]);

    const initialQuestions = Array.isArray(questionsData.data) ? questionsData.data : [];
    const initialPaginationMeta = questionsData.meta || null;
    const initialActiveUsers = Array.isArray(activeUsers) ? activeUsers : [];

    const questionList = buildListItems(
      initialQuestions.slice(0, 10).map((question) => ({
        name: question.title,
        url: question.slug ? `${SITE_URL}/questions/${question.slug}` : undefined,
      }))
    );
    const siteNode = websiteSchema('پرسش و پاسخ درباره موضوعات مختلف در بزرگترین انجمن ایران. سوالات خود را بپرسید و پاسخ‌ها را مشاهده کنید.');
    delete siteNode['@context'];

    const homeSchema: JsonLdNode = {
      '@context': 'https://schema.org',
      '@graph': [
        siteNode,
        ...(questionList.length
          ? [{
              '@type': 'ItemList',
              '@id': `${SITE_URL}/#questions`,
              name: 'آخرین پرسش‌ها',
              numberOfItems: questionList.length,
              itemListElement: questionList,
            }]
          : []),
      ],
    };

    return (
      <>
        <JsonLd data={homeSchema} />

        <HomeContent
          initialQuestions={initialQuestions}
          initialPaginationMeta={initialPaginationMeta}
          initialActiveUsers={initialActiveUsers}
        />
      </>
    );
  } catch {
    return (
      <>
        <JsonLd data={websiteSchema()} />
        <HomeContent
          initialQuestions={[]}
          initialPaginationMeta={null}
          initialActiveUsers={[]}
        />
      </>
    );
  }
}
