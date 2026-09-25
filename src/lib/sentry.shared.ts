import type { Options } from "@sentry/core";

export function getSentryDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN;
}

export function isSentryEnabled(): boolean {
  return Boolean(getSentryDsn());
}

export function getSentryEnvironment(): string {
  return (
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
    process.env.NODE_ENV ||
    "development"
  );
}

export function getBaseSentryOptions(): Partial<Options> {
  const enabled = isSentryEnabled();

  return {
    dsn: getSentryDsn(),
    enabled,
    environment: getSentryEnvironment(),
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    debug: process.env.NODE_ENV === "development" && enabled,
  };
}
