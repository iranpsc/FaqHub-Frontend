import { Suspense } from 'react';
import { Metadata } from 'next';
import { apiService } from '@/services/api';
import { AuthorDetailPageContent } from './AuthorDetailPageContent';
import { Question, User } from '@/services/types';

interface AuthorDetailPageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string; type?: string }>;
}

export async function generateMetadata({ params }: AuthorDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const authorUsername = resolvedParams.username;

  try {
    const author = await apiService.getAuthorServer(authorUsername);

    const title = ` سوالات پرسیده شده توسط | ${author.name ?? 'نویسنده'} `;
    const authorBio = typeof author.bio === 'string' ? author.bio : undefined;
    const description = authorBio && authorBio.trim()
      ? authorBio
      : `مطالب و فعالیت‌های ${author.name ?? 'نویسنده'}`;

    const baseUrl = 'https://faqhub.ir';
    const authorPathSegment = author.username ?? author.id;
    const url = `${baseUrl}/authors/${authorPathSegment}`;

    const avatar =
      typeof author.avatar === 'string' && author.avatar.trim().length > 0
        ? author.avatar.trim()
        : undefined;

    type OpenGraphImages = NonNullable<NonNullable<Metadata['openGraph']>['images']>;
    const openGraphImages: OpenGraphImages | undefined = avatar
      ? [{ url: avatar, alt: author.name ?? undefined }]
      : undefined;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        type: 'profile',
        images: openGraphImages,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: avatar ? [avatar] : undefined,
      },
    };
  } catch {
    return {
      title: 'نویسنده یافت نشد',
      description: 'نویسنده مورد نظر وجود ندارد یا حذف شده است.',
    };
  }
}

type AuthorSchemaQuestion = Question & { answer?: string };

function AuthorSchema({ author, questions }: { author: User; questions: AuthorSchemaQuestion[] }) {
  const authorDescription = typeof author.bio === 'string' ? author.bio : '';
  const authorAvatar = typeof author.avatar === 'string' ? author.avatar : '';
  const authorUrl = `https://faqhub.ir/authors/${author.username ?? author.id}`;

  const authorSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": author.name,
    "description": authorDescription,
    "image": authorAvatar,
    "url": authorUrl,
    "mainEntityOfPage": authorUrl,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": questions.map((q) => ({
      "@type": "Question",
      "name": q.title,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer || q.content || "پاسخ این سؤال در صفحه موجود است.",
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(authorSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

export default async function AuthorDetailPage({ params, searchParams }: AuthorDetailPageProps) {
  const resolvedParams = await params;
  const searchParamsData = await searchParams;
  const authorUsername = resolvedParams.username;
  const page = parseInt(searchParamsData.page || '1', 10);
  const typeParam = searchParamsData.type;
  const type =
    typeParam === 'answers' || typeParam === 'comments' ? typeParam : 'questions';

  try {
    const [authorResponse, questionsResponse] = await Promise.all([
      apiService.getAuthorServer(authorUsername),
      apiService.getAuthorQuestionsServer(authorUsername, page, type),
    ]);

    const questions: AuthorSchemaQuestion[] = questionsResponse.data || [];
    const resolvedAuthorUsername = authorResponse.username ?? authorUsername;

    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
            </div>
          </div>
        }
      >
        <AuthorSchema author={authorResponse} questions={questions} />
        <AuthorDetailPageContent
          initialAuthor={authorResponse}
          initialQuestions={questions}
          initialPagination={questionsResponse.meta}
          authorUsername={resolvedAuthorUsername}
          initialType={type}
        />
      </Suspense>
    );
  } catch (error) {
    console.error('Error fetching author data:', error);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            نویسنده یافت نشد
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            نویسنده مورد نظر وجود ندارد یا حذف شده است.
          </p>
        </div>
      </div>
    );
  }
}

