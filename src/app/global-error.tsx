"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            خطای غیرمنتظره
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            متأسفانه مشکلی در بارگذاری صفحه پیش آمد. تیم فنی از این خطا مطلع
            شده است.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              تلاش مجدد
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
