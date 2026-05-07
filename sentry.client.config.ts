import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
  // Capture unhandled promise rejections and JS errors
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,
});
