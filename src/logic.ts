import type { Hono } from "hono";

interface Tracker {
  name: string;
  category: string;
  found: boolean;
}

interface ScanResult {
  url: string;
  score: number;
  cookieConsent: { status: "found" | "missing"; details?: string };
  privacyPolicy: { status: "found" | "missing"; url?: string };
  termsOfService: { status: "found" | "missing"; url?: string };
  dpoContact: { status: "found" | "missing"; details?: string };
  dataRetention: { status: "found" | "missing" };
  trackers: Tracker[];
  recommendations: string[];
}

const TRACKER_PATTERNS: { name: string; category: string; pattern: RegExp }[] = [
  { name: "Google Analytics", category: "analytics", pattern: /(?:google-analytics\.com|gtag|ga\('|UA-\d+|G-[A-Z0-9]+|googletagmanager)/i },
  { name: "Facebook Pixel", category: "advertising", pattern: /(?:connect\.facebook\.net|fbq\(|facebook\.com\/tr)/i },
  { name: "Google Ads", category: "advertising", pattern: /(?:googleads\.g\.doubleclick|googlesyndication|adservices\.google)/i },
  { name: "Hotjar", category: "analytics", pattern: /(?:hotjar\.com|_hjSettings)/i },
  { name: "LinkedIn Insight", category: "advertising", pattern: /(?:snap\.licdn\.com|linkedin\.com\/px)/i },
  { name: "TikTok Pixel", category: "advertising", pattern: /(?:analytics\.tiktok\.com|ttq\.)/i },
  { name: "Mixpanel", category: "analytics", pattern: /(?:mixpanel\.com|mixpanel\.init)/i },
  { name: "Segment", category: "analytics", pattern: /(?:segment\.com\/analytics|analytics\.js)/i },
  { name: "Amplitude", category: "analytics", pattern: /(?:amplitude\.com|amplitude\.init)/i },
  { name: "Intercom", category: "marketing", pattern: /(?:intercom\.io|intercomSettings)/i },
  { name: "HubSpot", category: "marketing", pattern: /(?:hubspot\.com|hs-scripts|hbspt)/i },
  { name: "Crisp", category: "marketing", pattern: /(?:crisp\.chat|CRISP_WEBSITE_ID)/i },
  { name: "Clarity", category: "analytics", pattern: /(?:clarity\.ms)/i },
  { name: "Pinterest Tag", category: "advertising", pattern: /(?:pintrk|pinterest\.com\/ct)/i },
  { name: "Snapchat Pixel", category: "advertising", pattern: /(?:sc-static\.net\/scevent|snaptr\()/i },
];

const COOKIE_PATTERNS = /(?:cookie[-_\s]?(?:consent|banner|notice|popup|bar|policy|accept)|gdpr|cookiebot|onetrust|cookieyes|complianz|termly|iubenda|tarteaucitron|klaro)/i;
const PRIVACY_LINK_PATTERNS = /href=["'][^"']*(?:privacy|datenschutz|confidentialite|privacidade)[^"']*["']/gi;
const TERMS_LINK_PATTERNS = /href=["'][^"']*(?:terms|conditions|tos|cgu|agb|nutzungsbedingungen)[^"']*["']/gi;
const DPO_PATTERNS = /(?:data\s+protection\s+officer|DPO|dpo@|privacy@|datenschutzbeauftragter|délégué.*protection.*données)/i;
const RETENTION_PATTERNS = /(?:data\s+retention|retain(?:ed|s)?\s+(?:for|during)|storage\s+period|conservation\s+des\s+données|Aufbewahrungsfrist|delete(?:d)?\s+after)/i;

async function fetchPage(url: string): Promise<string> {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GDPRScanner/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return "";
    return await resp.text();
  } catch {
    return "";
  }
}

function extractHref(html: string, pattern: RegExp): string | undefined {
  const match = html.match(pattern);
  if (!match) return undefined;
  const hrefMatch = match[0].match(/href=["']([^"']+)["']/);
  return hrefMatch ? hrefMatch[1] : undefined;
}

export function registerRoutes(app: Hono) {
  app.get("/api/scan", async (c) => {
    const url = c.req.query("url");
    if (!url) return c.json({ error: "Missing required parameter: url" }, 400);

    let baseUrl: string;
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      baseUrl = `${parsed.protocol}//${parsed.host}`;
    } catch {
      return c.json({ error: "Invalid URL format" }, 400);
    }

    // Fetch main page + privacy + cookie pages in parallel
    const [mainHtml, privacyHtml, cookieHtml] = await Promise.all([
      fetchPage(baseUrl),
      fetchPage(`${baseUrl}/privacy-policy`),
      fetchPage(`${baseUrl}/cookie-policy`),
    ]);

    const allHtml = mainHtml + privacyHtml + cookieHtml;

    // Check cookie consent
    const hasCookieConsent = COOKIE_PATTERNS.test(mainHtml);
    const cookieConsent: ScanResult["cookieConsent"] = hasCookieConsent
      ? { status: "found", details: "Cookie consent mechanism detected on main page" }
      : { status: "missing" };

    // Check privacy policy
    const privacyHref = extractHref(mainHtml, PRIVACY_LINK_PATTERNS);
    const hasPrivacyContent = privacyHtml.length > 500;
    const privacyPolicy: ScanResult["privacyPolicy"] = privacyHref || hasPrivacyContent
      ? { status: "found", url: privacyHref || `${baseUrl}/privacy-policy` }
      : { status: "missing" };

    // Check terms
    const termsHref = extractHref(mainHtml, TERMS_LINK_PATTERNS);
    const termsOfService: ScanResult["termsOfService"] = termsHref
      ? { status: "found", url: termsHref }
      : { status: "missing" };

    // Check DPO contact
    const hasDpo = DPO_PATTERNS.test(allHtml);
    const dpoContact: ScanResult["dpoContact"] = hasDpo
      ? { status: "found", details: "DPO or privacy contact reference found" }
      : { status: "missing" };

    // Check data retention
    const hasRetention = RETENTION_PATTERNS.test(allHtml);
    const dataRetention: ScanResult["dataRetention"] = { status: hasRetention ? "found" : "missing" };

    // Detect trackers
    const trackers: Tracker[] = TRACKER_PATTERNS.map((t) => ({
      name: t.name,
      category: t.category,
      found: t.pattern.test(mainHtml),
    }));

    const activeTrackers = trackers.filter((t) => t.found);

    // Calculate score
    let score = 0;
    if (cookieConsent.status === "found") score += 25;
    if (privacyPolicy.status === "found") score += 25;
    if (termsOfService.status === "found") score += 10;
    if (dpoContact.status === "found") score += 15;
    if (dataRetention.status === "found") score += 10;
    // Penalize for trackers without consent
    if (activeTrackers.length > 0 && cookieConsent.status === "missing") score -= 15;
    // Bonus for having consent with trackers
    if (activeTrackers.length > 0 && cookieConsent.status === "found") score += 15;
    // No trackers at all is good
    if (activeTrackers.length === 0) score += 15;
    score = Math.max(0, Math.min(100, score));

    // Recommendations
    const recommendations: string[] = [];
    if (cookieConsent.status === "missing") recommendations.push("Add a cookie consent banner — required under GDPR for any non-essential cookies.");
    if (privacyPolicy.status === "missing") recommendations.push("Create and link a privacy policy page explaining data collection and processing.");
    if (termsOfService.status === "missing") recommendations.push("Add terms of service/conditions page with a link from footer.");
    if (dpoContact.status === "missing") recommendations.push("Provide a Data Protection Officer (DPO) contact or a privacy@domain email.");
    if (dataRetention.status === "missing") recommendations.push("Document data retention periods in your privacy policy.");
    if (activeTrackers.length > 0 && cookieConsent.status === "missing") {
      recommendations.push(`${activeTrackers.length} tracker(s) detected without cookie consent — this violates GDPR.`);
    }
    if (recommendations.length === 0) recommendations.push("Good GDPR compliance posture. Continue monitoring for changes.");

    const result: ScanResult = {
      url: baseUrl,
      score,
      cookieConsent,
      privacyPolicy,
      termsOfService,
      dpoContact,
      dataRetention,
      trackers: trackers.filter((t) => t.found),
      recommendations,
    };

    return c.json(result);
  });
}
