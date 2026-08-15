export const Session = {
  cookieName: "session",
  maxAgeMs: 30 * 24 * 60 * 60 * 1000, // 30 dias
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
  oauthCallback: "/api/oauth/callback",
} as const;
