import "server-only";
import { isIP } from "node:net";
import { headers } from "next/headers";

// The caller's IP as reported by the hosting platform (Vercel sets x-forwarded-for).
// Returns null when there isn't a valid one, e.g. plain local development.
export async function getRequestIp(): Promise<string | null> {
  const h = await headers();
  const raw = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip")?.trim() || "";
  return isIP(raw) ? raw : null;
}

// Loopback / private / carrier-NAT addresses identify a network hop shared by many
// people, not one person, so they must never be blocked.
export function isPublicIp(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    if (a >= 224) return false;
    return true;
  }
  if (kind === 6) {
    const v = ip.toLowerCase();
    if (v === "::" || v === "::1") return false;
    if (v.startsWith("fe80") || v.startsWith("fc") || v.startsWith("fd")) return false;
    if (v.startsWith("::ffff:")) return isPublicIp(v.slice(7));
    return true;
  }
  return false;
}
