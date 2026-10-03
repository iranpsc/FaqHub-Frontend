
// app/questions/[slug]/page.tsx
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { apiService } from "@/services/api"
import QuestionDetailsContent from "@/components/QuestionDetailsContent"
import { JsonLd } from "@/components/JsonLd"
import { Answer, Question } from "@/services/types"
import { htmlToPlainText } from "@/lib/sanitize"
import { buildQaPageSchema, type QaPageComments } from "@/lib/schema"

// Cache the question fetch to avoid duplicate API calls
const getQuestion = cache(async (slug: string) => {
  return await apiService.getQuestionBySlugServer(slug);
});

// Cache the answers fetch
const getAnswers = cache(async (questionId: string) => {
  return await apiService.getQuestionAnswersServer(questionId);
});

async function loadVisibleComments(questionId: string, answers: Answer[]): Promise<QaPageComments> {
  const [questionResult, ...answerResults] = await Promise.all([
    apiService.getCommentsServer(questionId, 'question').catch(() => null),
    ...answers.map((answer) =>
      apiService.getCommentsServer(answer.id, 'answer').catch(() => null)
    ),
  ]);

  const answerComments: NonNullable<QaPageComments['answerComments']> = {};
  answers.forEach((answer, index) => {
    const result = answerResults[index];
    if (!result) return;
    answerComments[answer.id] = {
      comments: result.data || [],
      total: result.meta?.total,
    };
  });

  return {
    questionComments: questionResult?.data || [],
    questionCommentTotal: questionResult?.meta?.total,
    answerComments,
  };
}

export const revalidate = 300; // Revalidate every 5 minutes

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const question = await getQuestion(slug)

  const title = question?.title || "سؤال بدون عنوان"
  const description =
    htmlToPlainText(question?.content || "").slice(0, 160) ||
    "پرسش و پاسخ در مورد موضوعات مختلف در FAQHub"
  const url = `https://faqhub.ir/questions/${slug}`

  return {
    title: `${title} | FAQHub`,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article",
      locale: "fa_IR",
      siteName: "FAQHub",
      images: [
        {
          url: "/main-logo.png",
          width: 800,
          height: 600,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://faqhub.ir/assets/icons/main-logo.PNG"],
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function QuestionDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const question: Question = await getQuestion(slug)
  if (!question?.id) {
    notFound()
  }

  let answers: Answer[] = []
  try {
    const answersResponse = await getAnswers(question.id)
    answers = answersResponse?.data || []
  } catch {
    answers = []
  }

  const commentExtras = await loadVisibleComments(question.id, answers)

  return (
    <>
      <JsonLd data={buildQaPageSchema(question, answers, slug, commentExtras)} />

      <QuestionDetailsContent
        slug={slug}
        initialQuestion={question}
        initialAnswers={answers}
      />
    </>
  )
}

