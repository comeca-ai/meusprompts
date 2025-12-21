#!/bin/bash

# build_submission_bundle.sh
# Generates the assets and documentation required for OpenAI App Store submission.

OUTPUT_DIR="submission_bundle"
mkdir -p "$OUTPUT_DIR"

echo "Building Submission Bundle in $OUTPUT_DIR..."

# 1. Generate Manifest (simulated)
echo "Generating manifest.json..."
cat <<EOF > "$OUTPUT_DIR/manifest.json"
{
  "name": "Meus Prompts AI",
  "description": "Gerenciador inteligente de prompts. Salve, organize e otimize seus prompts com IA.",
  "logo": "logo.png",
  "legal_info_url": "https://meusprompts.ia.br/legal",
  "privacy_policy_url": "https://meusprompts.ia.br/privacy",
  "tools": [
    {
      "name": "save_prompt",
      "description": "Save a new prompt to the library."
    },
    {
      "name": "list_prompts",
      "description": "Retrieve saved prompts."
    },
    {
      "name": "get_prompt",
      "description": "Get details of a specific prompt."
    },
    {
      "name": "optimize_prompt",
      "description": "Use AI to improve a prompt."
    }
  ]
}
EOF

# 2. Create placeholder for Logo
echo "Creating placeholder logo..."
# In a real scenario we would copy the actual logo
touch "$OUTPUT_DIR/logo.png"

# 3. Create 'how_to_test.md'
echo "Creating how_to_test.md..."
cat <<EOF > "$OUTPUT_DIR/how_to_test.md"
# How to Test: Meus Prompts AI

## Overview
This App provides a suite of tools to save, list, and optimize prompts.
**Note:** The prompt optimization is performed by an OpenAI-hosted Agent (OpenAI Agents API). Our MCP exposes the database tools (Cloudflare D1) and proxies the 'optimize' requests to the configured Agent.

## Testing without Auth (Mocked/Proxy)
For testing purposes, you can curl the endpoints directly if you have the URL.

### 1. Health Check
\`\`\`bash
curl https://your-worker-url/
\`\`\`
Expected: \`{"status":"ok", "service": "Meus Prompts MCP"}\`

### 2. List Prompts (Mocked)
\`\`\`bash
curl -X POST https://your-worker-url/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_prompts",
      "arguments": {}
    }
  }'
\`\`\`

Expected Response:
\`\`\`json
{
  "result": {
    "structuredContent": { "prompts": [...], "view_type": "list" },
    "_meta": { "openai/widgetCSP": ... }
  }
}
\`\`\`

## Data Privacy & Compliance
- **Data Residency:** Global (Worker deployed worldwide, Agent on OpenAI US).
- **PII:** Inputs are redacted before any logging.
- **Agent Execution:** The logic runs on OpenAI infrastructure; the Worker is a pass-through.

EOF

# 4. Create README for the bundle
echo "Creating bundle README..."
cat <<EOF > "$OUTPUT_DIR/README.txt"
OpenAI App Submission Bundle

Contents:
- manifest.json: App definition
- logo.png: Application Icon (512x512)
- how_to_test.md: Instructions for reviewers

Deployment:
1. Ensure Worker is deployed: \`npx wrangler deploy\`
2. Set Secrets:
   - \`npx wrangler secret put OPENAI_API_KEY\`
   - \`npx wrangler secret put AGENT_ID\`
   - \`npx wrangler secret put OPENAI_VERIFICATION_TOKEN\`
3. Verify endpoints using \`run_tests.sh\` locally or curl against the deployed URL.

Reviewer Notes:
Please refer to 'how_to_test.md' for details on the Agent-based architecture.
EOF

echo "✅ Bundle created successfully in '$OUTPUT_DIR/'."
ls -F "$OUTPUT_DIR/"
