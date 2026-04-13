import type { ApiConfig } from "./shared";

export const API_CONFIG: ApiConfig = {
  name: "gdpr-scanner",
  slug: "gdpr-scanner",
  description: "Scan any website for GDPR compliance -- cookie consent, privacy policy, trackers, DPO contact. Score 0-100.",
  version: "1.0.0",
  routes: [
    {
      method: "GET",
      path: "/api/scan",
      price: "$0.02",
      description: "Scan a website for GDPR compliance — cookie consent, privacy policy, trackers",
      toolName: "compliance_scan_gdpr",
      toolDescription:
        `Use this when you need to check a website's GDPR compliance. Scans the URL plus /privacy-policy and /cookie-policy pages. Returns a compliance report in JSON.

Returns: 1. complianceScore (0-100) 2. cookieConsent (detected boolean, type) 3. privacyPolicy (found boolean, url) 4. termsOfService (found boolean) 5. dpoContact (found boolean, email) 6. dataRetention (mentioned boolean) 7. thirdPartyTrackers array (Google Analytics, Facebook Pixel, etc.) 8. recommendations array.

Example output: {"url":"https://example.com","complianceScore":72,"cookieConsent":{"detected":true,"type":"banner"},"privacyPolicy":{"found":true,"url":"/privacy"},"thirdPartyTrackers":["Google Analytics","Facebook Pixel"],"recommendations":["Add DPO contact info","Add data retention policy"]}

Use this BEFORE launching a website in the EU, FOR compliance audits, due diligence on acquisitions, and regular privacy monitoring.

Do NOT use for PII in text -- use compliance_detect_pii instead. Do NOT use for tech detection -- use website_detect_tech_stack instead. Do NOT use for HTTP security headers -- use network_analyze_headers instead.`,
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
      outputSchema: {
          "type": "object",
          "properties": {
            "url": {
              "type": "string",
              "description": "URL scanned"
            },
            "score": {
              "type": "number",
              "description": "GDPR compliance score 0-100"
            },
            "issues": {
              "type": "array",
              "items": {
                "type": "object"
              },
              "description": "GDPR issues found"
            },
            "cookies": {
              "type": "object",
              "description": "Cookie analysis results"
            },
            "privacyPolicy": {
              "type": "object",
              "description": "Privacy policy analysis"
            },
            "consentBanner": {
              "type": "object",
              "description": "Consent banner analysis"
            },
            "trackers": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Third-party trackers found"
            }
          },
          "required": [
            "url",
            "score",
            "issues"
          ]
        },
    },
  ],
};
