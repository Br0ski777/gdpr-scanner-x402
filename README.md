# GDPR Scanner API

[![MCP Server](https://img.shields.io/badge/MCP-server-blue)](https://gdpr-scanner.api.klymax402.com/mcp)
[![x402](https://img.shields.io/badge/payments-x402-6E56CF)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Scan any website for GDPR compliance -- cookie consent, privacy policy, trackers, DPO contact. Score 0-100. Pay-per-call via [x402](https://x402.org) (USDC on Base L2) -- no API key, no signup, no rate-limit wall.

Part of the [klymax402](https://klymax402.com) marketplace -- 100 x402 micropayment APIs for AI agents, one wallet, USDC on Base.

## Quickstart -- MCP

Add to your MCP client config (Claude Desktop, Cursor, ElizaOS, etc.):

```json
{
  "mcpServers": {
    "gdpr-scanner": {
      "url": "https://gdpr-scanner.api.klymax402.com/mcp"
    }
  }
}
```

## Quickstart -- HTTP (x402)

```bash
curl "https://gdpr-scanner.api.klymax402.com/api/scan?url=https://example.com"
# -> 402 Payment Required, with an x402 payment challenge in the response body
```

Any x402-aware client ([`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch), [`x402-agent-tools`](https://www.npmjs.com/package/x402-agent-tools), ATXP) handles the 402 -> sign -> retry cycle automatically.

## Tools

| Tool | Method | Path | Price | Description |
|---|---|---|---|---|
| `compliance_scan_gdpr` | GET | `/api/scan` | $0.03 | Scan a website for GDPR compliance — cookie consent, privacy policy, trackers |
| `compliance_scan_gdpr` | POST | `/api/scan` | $0.03 | Scan a website for GDPR compliance — cookie consent, privacy policy, trackers (POST variant) |

### `compliance_scan_gdpr`

Use this when you need to check a website's GDPR compliance. Scans the URL plus /privacy-policy and /cookie-policy pages. Returns a compliance report in JSON.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `url` | string | yes | Website URL to scan for GDPR compliance (e.g. https://example.com) |

Example response:

```json
{"url":"https://example.com","complianceScore":72,"cookieConsent":{"detected":true,"type":"banner"},"privacyPolicy":{"found":true,"url":"/privacy"},"thirdPartyTrackers":["Google Analytics","Facebook Pixel"],"recommendations":["Add DPO contact info","Add data retention policy"]}
```

**When to use**: launching a website in the EU, FOR compliance audits, due diligence on acquisitions, and regular privacy monitoring.

**Not for**: PII in text (use `compliance_detect_pii`), tech detection (use `website_detect_tech_stack`), HTTP security headers (use `network_analyze_headers`).

### `compliance_scan_gdpr`

Use this when you need to check a website's GDPR compliance. Scans the URL plus /privacy-policy and /cookie-policy pages. Returns a compliance report in JSON. POST variant of compliance_scan_gdpr -- same params passed as JSON body instead of query string.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `url` | string | yes | Website URL to scan for GDPR compliance (e.g. https://example.com) |

Example response:

```json
{"url":"https://example.com","complianceScore":72,"cookieConsent":{"detected":true,"type":"banner"},"privacyPolicy":{"found":true,"url":"/privacy"},"thirdPartyTrackers":["Google Analytics","Facebook Pixel"],"recommendations":["Add DPO contact info","Add data retention policy"]}
```

**When to use**: launching a website in the EU, FOR compliance audits, due diligence on acquisitions, and regular privacy monitoring.

**Not for**: PII in text (use `compliance_detect_pii`), tech detection (use `website_detect_tech_stack`), HTTP security headers (use `network_analyze_headers`).

## Example agent prompts

- "Check a website's GDPR compliance"
- "Check a website's GDPR compliance"

## Payment

- Protocol: [x402](https://x402.org) -- HTTP-native pay-per-call, no signup, no API key
- Network: Base L2 (`eip155:8453`)
- Asset: USDC
- Facilitator: Coinbase CDP (primary), PayAI (fallback)

## Part of klymax402

100 x402 micropayment APIs for AI agents -- one wallet, USDC on Base, zero signup.

- Catalog: https://klymax402.com/llms.txt
- Full API reference: https://klymax402.com/llms-full.txt
- Live stats: https://klymax402.com/stats

## License

MIT
