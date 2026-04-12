import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "gdpr-scanner",
  slug: "gdpr-scanner",
  description: "Scan website GDPR compliance: cookie consent, privacy policy, trackers. Score 0-100.",
  version: "1.0.0",
  routes: [
    {
      method: "GET",
      path: "/api/scan",
      price: "$0.02",
      description: "Scan a website for GDPR compliance — cookie consent, privacy policy, trackers",
      toolName: "compliance_scan_gdpr",
      toolDescription:
        "Use this when you need to check a website's GDPR compliance. Scans the URL plus /privacy-policy and /cookie-policy pages. Checks for cookie consent banner, privacy policy link, terms link, DPO contact info, data retention mentions, and third-party trackers (Google Analytics, Facebook Pixel, etc.). Returns a compliance score 0-100 with detailed findings and recommendations. Do NOT use for PII in text — use compliance_detect_pii. Do NOT use for tech detection — use website_detect_tech_stack.",
      inputSchema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "Website URL to scan for GDPR compliance (e.g. https://example.com)",
          },
        },
        required: ["url"],
      },
    },
  ],
};
