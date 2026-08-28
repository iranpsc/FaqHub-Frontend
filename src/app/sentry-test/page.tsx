import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getSentryEnvironment,
  isSentryEnabled,
} from "@/lib/sentry.shared";
import { SentryTestContent } from "./SentryTestContent";

export const metadata: Metadata = {
  title: "تست Sentry | انجمن حم",
  robots: { index: false, follow: false },
};

export default function SentryTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <section className="mt-[60px] lg:mt-0 mx-auto px-4 lg:px-9 !font-azarMehr py-12">
      <h1 className="font-rokh font-bold text-2xl md:text-3xl text-center dark:text-white mb-2">
        تست Sentry
      </h1>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-10">
        این صفحه فقط در محیط development در دسترس است.
      </p>
      <SentryTestContent
        sentryEnabled={isSentryEnabled()}
        environment={getSentryEnvironment()}
      />
    </section>
  );
}
