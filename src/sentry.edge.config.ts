import * as Sentry from "@sentry/nextjs";
import { getBaseSentryOptions } from "@/lib/sentry.shared";

Sentry.init(getBaseSentryOptions());
