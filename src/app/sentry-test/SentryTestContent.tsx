"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

type Props = {
  sentryEnabled: boolean;
  environment: string;
};

export function SentryTestContent({ sentryEnabled, environment }: Props) {
  const [lastAction, setLastAction] = useState<string | null>(null);

  const runAction = (label: string, action: () => void | Promise<void>) => {
    setLastAction(label);
    void action();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-3">
        <h2 className="font-rokh font-bold text-lg dark:text-white">وضعیت</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-gray-500 dark:text-gray-400">Sentry</dt>
          <dd className={sentryEnabled ? "text-green-600" : "text-amber-600"}>
            {sentryEnabled ? "فعال" : "غیرفعال — DSN تنظیم نشده"}
          </dd>
          <dt className="text-gray-500 dark:text-gray-400">محیط</dt>
          <dd className="dark:text-white">{environment}</dd>
        </dl>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h2 className="font-rokh font-bold text-lg dark:text-white">
          تست خطا
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          پس از کلیک، چند ثانیه بعد در داشبورد Sentry بخش Issues بررسی کنید.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              runAction("client-error", () => {
                throw new Error("Sentry Test Error — client exception");
              })
            }
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm"
          >
            پرتاب خطای کلاینت
          </button>

          <button
            type="button"
            onClick={() =>
              runAction("captured-exception", () => {
                Sentry.captureException(
                  new Error("Sentry Test Error — captured exception"),
                );
              })
            }
            className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors text-sm"
          >
            captureException
          </button>

          <button
            type="button"
            onClick={() =>
              runAction("message", () => {
                Sentry.captureMessage("Sentry Test Message", "info");
              })
            }
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
          >
            captureMessage
          </button>

          <button
            type="button"
            onClick={() =>
              runAction("async-error", async () => {
                await new Promise((resolve) => setTimeout(resolve, 100));
                throw new Error("Sentry Test Error — async rejection");
              })
            }
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm"
          >
            خطای async
          </button>
        </div>

        {lastAction && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            آخرین عملیات: {lastAction}
          </p>
        )}
      </div>
    </div>
  );
}
