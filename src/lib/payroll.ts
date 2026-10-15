export function estimatePay(monthlyGrossKobo: number) {
  const gross = Math.max(0, Math.round(monthlyGrossKobo));
  const pension = Math.round(gross * 0.08);
  const withholding = Math.round(gross * 0.1);
  return {
    gross,
    pension,
    withholding,
    net: gross - pension - withholding,
  };
}

export function safeWebhookUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    /^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)
  ) {
    return null;
  }
  return url.toString();
}
