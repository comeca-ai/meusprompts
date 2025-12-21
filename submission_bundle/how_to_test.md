# How to Test: Meus Prompts AI

## Overview
This App provides a suite of tools to save, list, and optimize prompts.
**Note:** The prompt optimization is performed by an OpenAI-hosted Agent (OpenAI Agents API). Our MCP exposes the database tools (Cloudflare D1) and proxies the 'optimize' requests to the configured Agent.

## Testing without Auth (Mocked/Proxy)
For testing purposes, you can curl the endpoints directly if you have the URL.

### 1. Health Check
```bash
curl https://your-worker-url/
```
Expected: `{"status":"ok", "service": "Meus Prompts MCP"}`

### 2. List Prompts (Mocked)
```bash
curl -X POST https://your-worker-url/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_prompts",
      "arguments": {}
    }
  }'
```

Expected Response:
```json
{
  "result": {
    "structuredContent": { "prompts": [...], "view_type": "list" },
    "_meta": { "openai/widgetCSP": ... }
  }
}
```

## Data Privacy & Compliance
- **Data Residency:** Global (Worker deployed worldwide, Agent on OpenAI US).
- **PII:** Inputs are redacted before any logging.
- **Agent Execution:** The logic runs on OpenAI infrastructure; the Worker is a pass-through.

