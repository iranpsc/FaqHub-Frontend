import { Suspense } from "react";
import { ActivityPageContent } from "./ActivityPageContent";
import { JsonLd } from "@/components/JsonLd";
import { apiService } from "@/services/api";
import { absoluteUrl, buildCollectionPage, SITE_URL } from "@/lib/schema";
import {
  DailyActivity,
  ActivityApiResponse,
  ActivityGroupedData,
  ActivityPagination,
} from "@/services/types";

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable static generation for this page

export async function generateMetadata() {
  return {
    title: "فعالیت‌ها | انجمن",
    description: "لیست آخرین فعالیت‌ها شامل سوالات، پاسخ‌ها و نظرات کاربران.",
    alternates: { canonical: `${SITE_URL}/activities` },
    openGraph: {
      title: "فعالیت‌ها | انجمن",
      description: "آخرین فعالیت‌های کاربران شامل سوال، پاسخ و نظر",
      url: `${SITE_URL}/activities`,
      siteName: "انجمن حم",
      images: [
        {
          url: "/main-logo.png",
          width: 1200,
          height: 630,
          alt: "فعالیت‌ها",
        },
      ],
      locale: "fa_IR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "فعالیت‌ها",
      description: "آخرین فعالیت‌های کاربران انجمن",
      images: ["/main-logo.png"],
    },
  };
}

export default async function ActivityPage() {
  // 🟢 گرفتن دیتا SSR با error handling برای build time و production
  let response: ActivityApiResponse;
  try {
    response = await apiService.getActivity({
      limit: 30,
      offset: 0,
    }) as ActivityApiResponse;
    
    // Ensure response is valid even if API returns unexpected format
    if (!response || typeof response !== 'object') {
      response = {
        success: false,
        data: [],
        error: 'Invalid API response format'
      } as ActivityApiResponse;
    }
  } catch (error) {
    // Handle API failures gracefully (build time, production timeouts, network errors)
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'خطا در دریافت فعالیت‌ها';
    
    // Only log in development to avoid leaking sensitive info in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch activities:', error);
    }
    
    response = {
      success: false,
      data: [],
      error: errorMessage
    } as ActivityApiResponse;
  }

  // Safely extract activities with fallback
  const activities: DailyActivity[] = (response?.success && Array.isArray(response?.data)) 
    ? response.data 
    : [];

  const groupedActivities: ActivityGroupedData = response.success && response.grouped_data
    ? response.grouped_data
    : activities.reduce<ActivityGroupedData>((acc, activity) => {
        if (activity.month) {
          if (!acc[activity.month]) {
            acc[activity.month] = [];
          }
          acc[activity.month].push(activity);
        }
        return acc;
      }, {});

  const pagination: ActivityPagination | null = response.pagination ?? null;

  const itemListSchema = buildCollectionPage({
    url: `${SITE_URL}/activities`,
    name: "فعالیت‌های کاربران",
    description: "لیست سوالات، پاسخ‌ها و نظرات کاربران در انجمن",
    items: activities.slice(0, 20).map((activityItem) => ({
      name: activityItem.title || activityItem.description,
      url: absoluteUrl(activityItem.url),
    })),
  });

  return (
    <>
      <JsonLd data={itemListSchema} />

      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                در حال بارگذاری فعالیت‌ها...
              </p>
            </div>
          </div>
        }
      >
        <ActivityPageContent
          initialActivities={activities}
          initialGroupedActivities={groupedActivities}
          initialPagination={pagination}
        />
      </Suspense>
    </>
  );
}
