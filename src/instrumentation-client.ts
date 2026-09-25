import * as Sentry from "@sentry/nextjs";
import { getBaseSentryOptions } from "@/lib/sentry.shared";

Sentry.init({
  ...getBaseSentryOptions(),
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
