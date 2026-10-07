import { Suspense } from 'react';
import { Metadata } from 'next';
import { apiService } from '@/services/api';
import { AuthorDetailPageContent } from './AuthorDetailPageContent';
import { JsonLd } from '@/components/JsonLd';
import { buildListItems, buildProfilePageSchema, SITE_URL, type JsonLdNode } from '@/lib/schema';
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

function authorStructuredData(author: User, questions: Question[], type: string): JsonLdNode[] {
  const profile = buildProfilePageSchema(author);
  const nodes: JsonLdNode[] = profile ? [profile] : [];

  if (type !== 'questions') return nodes;

  const list = buildListItems(
    questions.map((question) => ({
      name: question.title,
      url: question.slug ? `${SITE_URL}/questions/${question.slug}` : undefined,
    }))
  );

  if (list.length === 0) return nodes;

  const authorUrl = `${SITE_URL}/authors/${author.username ?? author.id}`;
  nodes.push({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${authorUrl}#questions`,
    name: `پرسش‌های ${author.name}`,
    numberOfItems: list.length,
    itemListElement: list,
  });

  return nodes;
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

    const questions: Question[] = questionsResponse.data || [];
    const resolvedAuthorUsername = authorResponse.username ?? authorUsername;

    return (
      <>
        <JsonLd data={authorStructuredData(authorResponse, questions, type)} />
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
        <AuthorDetailPageContent
          initialAuthor={authorResponse}
          initialQuestions={questions}
          initialPagination={questionsResponse.meta}
          authorUsername={resolvedAuthorUsername}
          initialType={type}
        />
        </Suspense>
      </>
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

