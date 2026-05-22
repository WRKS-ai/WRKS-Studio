// Cross-app URLs. App lives on a separate workspace/origin.
// In dev: app runs on port 3001. In prod: app.slightwrks.com.
// Override via NEXT_PUBLIC_APP_URL.

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

export const SIGN_UP_URL = `${APP_URL}/sign-up`;
export const SIGN_IN_URL = `${APP_URL}/sign-in`;
