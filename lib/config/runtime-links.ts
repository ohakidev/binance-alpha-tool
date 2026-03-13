const LOCAL_HOST_PATTERNS = ["localhost", "127.0.0.1", "0.0.0.0"];

function trimValue(value?: string | null): string {
  return value?.trim() || "";
}

function withHttps(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

function normalizeUrl(value?: string | null): string | null {
  const trimmed = trimValue(value).replace(/\/+$/, "");
  if (!trimmed) {
    return null;
  }

  const candidate = withHttps(trimmed);

  try {
    const parsed = new URL(candidate);
    if (LOCAL_HOST_PATTERNS.includes(parsed.hostname)) {
      return null;
    }

    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function normalizeTelegramHandle(value?: string | null): string | null {
  const trimmed = trimValue(value);
  if (!trimmed) {
    return null;
  }

  const withoutAt = trimmed.replace(/^@/, "");
  if (!withoutAt || withoutAt.startsWith("-") || /^\d+$/.test(withoutAt)) {
    return null;
  }

  if (!/^[A-Za-z0-9_]{5,}$/.test(withoutAt)) {
    return null;
  }

  return withoutAt;
}

export function resolveWebsiteUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  const candidates = [
    env.APP_URL,
    env.NEXT_PUBLIC_APP_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL,
    env.VERCEL_BRANCH_URL,
    env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export function resolveAlertChannelUrl(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const explicitUrl = normalizeUrl(env.NEXT_PUBLIC_ALERT_CHANNEL_URL);
  if (explicitUrl) {
    return explicitUrl;
  }

  const handle = normalizeTelegramHandle(env.TELEGRAM_CHAT_ID);
  if (!handle) {
    return null;
  }

  return `https://t.me/${handle}`;
}
