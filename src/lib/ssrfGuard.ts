// SSRF protection for outbound fetches to admin-supplied URLs
// (affiliate webhook + API delivery endpoints).
//
// An admin who configures a partner with `lead_webhook_url` is trusted
// in the normal case, but a compromised admin account — or a misclick
// — should not be able to make our server fetch internal/cloud-metadata
// endpoints. This guard:
//
//   1. Requires https://
//   2. Rejects literal IP hosts (e.g. http://127.0.0.1)
//   3. Resolves the hostname and rejects any private/reserved range:
//      RFC1918, loopback, link-local (incl. AWS metadata 169.254.169.254),
//      v6 unique-local, v6 loopback, v6 link-local.
//
// Returns null on safe, or an error string explaining the rejection.

import { lookup as dnsLookup } from 'node:dns/promises';

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true; // unparseable → unsafe
  const [a, b] = parts;
  if (a === 10) return true;                                       // 10.0.0.0/8
  if (a === 127) return true;                                      // 127.0.0.0/8
  if (a === 169 && b === 254) return true;                         // link-local (AWS metadata)
  if (a === 172 && b >= 16 && b <= 31) return true;                // 172.16.0.0/12
  if (a === 192 && b === 168) return true;                         // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true;               // CGNAT 100.64.0.0/10
  if (a === 0) return true;                                        // 0.0.0.0/8
  if (a >= 224) return true;                                       // multicast + reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('fe80:')) return true;                      // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique-local fc00::/7
  if (lower.startsWith('::ffff:')) {
    // IPv4-mapped — re-check as IPv4
    const v4 = lower.slice(7);
    return isPrivateIPv4(v4);
  }
  return false;
}

export async function assertSafeOutboundUrl(rawUrl: string): Promise<string | null> {
  let url: URL;
  try { url = new URL(rawUrl); } catch { return 'invalid_url'; }
  if (url.protocol !== 'https:') return 'not_https';
  if (url.username || url.password) return 'credentials_in_url';

  // Reject hostnames that already are IP literals before DNS resolution.
  const host = url.hostname;
  const isV4Literal = /^[0-9.]+$/.test(host);
  const isV6Literal = host.includes(':') || /^\[.*\]$/.test(host);
  if (isV4Literal && isPrivateIPv4(host)) return 'private_ip';
  if (isV6Literal && isPrivateIPv6(host.replace(/^\[|\]$/g, ''))) return 'private_ip';

  // DNS resolution — reject if any A/AAAA record lands in a private range.
  // Note: this is TOCTOU-imperfect; a hostile DNS server could return a
  // public IP at resolve time then a private IP at fetch time. For full
  // protection you'd resolve here, pin, and pass the IP to the request
  // with a Host header. Acceptable for an admin-configured URL.
  try {
    const records = await dnsLookup(host, { all: true });
    for (const r of records) {
      if (r.family === 4 && isPrivateIPv4(r.address)) return 'private_ip';
      if (r.family === 6 && isPrivateIPv6(r.address)) return 'private_ip';
    }
  } catch {
    return 'dns_failed';
  }

  return null;
}
