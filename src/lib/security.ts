// src/lib/security.ts
// Centralized security utilities used across all API routes

// ─── IP extraction (spoofing-resistant) ─────────────────────────────────────
// On Vercel, the real client IP is in x-real-ip set by the edge network.
// x-forwarded-for is user-controllable and must be treated as untrusted.
// We use x-real-ip first, then fall back to the last entry in x-forwarded-for
// (which is set by our own infrastructure, not the client).

export function getClientIp(req: Request): string {
  const realIp = (req.headers as any).get?.("x-real-ip") ??
                 (req as any).headers?.["x-real-ip"];
  if (realIp && isValidIp(realIp.trim())) return realIp.trim();

  const forwarded = (req.headers as any).get?.("x-forwarded-for") ??
                    (req as any).headers?.["x-forwarded-for"] ?? "";
  // Take the LAST entry — set by our infra, not the client
  const ips = forwarded.split(",").map((s: string) => s.trim()).filter(Boolean);
  const last = ips[ips.length - 1];
  if (last && isValidIp(last)) return last;

  return "unknown";
}

function isValidIp(ip: string): boolean {
  // Basic IPv4 and IPv6 validation
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^[0-9a-fA-F:]{2,39}$/;
  return ipv4.test(ip) || ipv6.test(ip);
}

// ─── Input sanitization for AI prompts ──────────────────────────────────────
// Prevents prompt injection via user-supplied strings inserted into AI prompts

export function sanitizeForPrompt(input: string, maxLen = 500): string {
  return input
    .slice(0, maxLen)
    // Remove common prompt injection patterns
    .replace(/ignore (previous|above|all) instructions?/gi, "[removed]")
    .replace(/system prompt/gi, "[removed]")
    .replace(/\bDAN\b/g, "[removed]")
    .replace(/jailbreak/gi, "[removed]")
    // Normalize whitespace
    .replace(/[\r\n]{3,}/g, "\n\n")
    .trim();
}

// ─── File name sanitization ──────────────────────────────────────────────────

export function sanitizeFileName(name: string): string {
  return name
    .slice(0, 255)
    // Remove path traversal
    .replace(/\.\./g, "")
    .replace(/[/\\]/g, "")
    // Keep only safe characters
    .replace(/[^\w\s.\-()[\]]/g, "")
    .trim() || "untitled";
}

// ─── Base64 image validation ─────────────────────────────────────────────────
// Ensures frame data is actually a JPEG/PNG image, not arbitrary data

export function validateBase64Image(b64: string): boolean {
  if (!b64 || typeof b64 !== "string") return false;
  // Max 400KB per frame (base64 encoded ~533KB raw)
  if (b64.length > 533_334) return false;
  // Must start with JPEG or PNG magic bytes (in base64)
  // JPEG: FF D8 FF → /9j/ in base64
  // PNG:  89 50 4E 47 → iVBOR in base64
  const validPrefixes = ["/9j/", "iVBOR"];
  return validPrefixes.some((p) => b64.startsWith(p));
}

// ─── Sanitize AI output before storing / rendering ──────────────────────────
// Prevents stored XSS via AI-generated content

export function sanitizeAiText(text: string, maxLen = 2000): string {
  if (typeof text !== "string") return "";
  return text
    .slice(0, maxLen)
    // Strip HTML tags
    .replace(/<[^>]*>/g, "")
    // Normalize
    .trim();
}

export function sanitizeAiArray(arr: unknown, maxItems = 15, maxItemLen = 500): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, maxItems)
    .filter((x) => typeof x === "string")
    .map((x) => sanitizeAiText(x as string, maxItemLen));
}

// ─── URL validation for redirect safety ─────────────────────────────────────

export function isSafeRedirectUrl(url: string, allowedOrigin: string): boolean {
  try {
    const parsed = new URL(url);
    const allowed = new URL(allowedOrigin);
    return parsed.hostname === allowed.hostname;
  } catch {
    return false;
  }
}

// ─── Content-Type guard ──────────────────────────────────────────────────────

export function requireContentType(req: Request, expected: string): boolean {
  const ct = (req.headers as any).get?.("content-type") ?? "";
  return ct.toLowerCase().includes(expected.toLowerCase());
}

// ─── Timing-safe string comparison (prevents timing attacks on tokens) ───────

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ─── Request size guard ──────────────────────────────────────────────────────
// Call before parsing JSON to reject oversized bodies

export async function readBodyWithLimit(
  req: Request,
  maxBytes = 5 * 1024 * 1024 // 5MB default
): Promise<string | null> {
  const contentLength = parseInt(
    (req.headers as any).get?.("content-length") ?? "0"
  );
  if (contentLength > maxBytes) return null;

  const text = await req.text();
  if (text.length > maxBytes) return null;
  return text;
}
