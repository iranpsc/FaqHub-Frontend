import HomeContent from '@/components/HomeContent';
import { apiService } from '@/services/api';

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

    // Prepare top questions for FAQ schema (optimized)
    const topQuestions = initialQuestions
      .filter(q => q?.title && q?.content)
      .slice(0, 5)
      .map(q => {
        // Use plain_content if available from backend, otherwise do minimal processing
        const answerText = q.plain_content || q.content.substring(0, 500);
        
        return {
          "@type": "Question",
          name: q.title,
          url: `https://faqhub.ir/questions/${q.slug}`,
          acceptedAnswer: {
            "@type": "Answer",
            text: answerText,
          },
        };
      });

    const siteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: "https://faqhub.ir",
      name: "انجمن حم",
      description: "بزرگترین انجمن پرسش و پاسخ ایران",
      publisher: { "@type": "Organization", name: "انجمن حم", url: "https://faqhub.ir" },
      potentialAction: {
        "@type": "SearchAction",
        target: "https://faqhub.ir/search?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    };

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: topQuestions,
    };

    return (
      <>
        {/* JSON-LD Schemas */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

        <HomeContent
          initialQuestions={initialQuestions}
          initialPaginationMeta={initialPaginationMeta}
          initialActiveUsers={initialActiveUsers}
        />
      </>
    );
  } catch {
    return (
      <HomeContent
        initialQuestions={[]}
        initialPaginationMeta={null}
        initialActiveUsers={[]}
      />
    );
  }
}
