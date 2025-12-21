OpenAI App Submission Bundle

Contents:
- manifest.json: App definition
- logo.png: Application Icon (512x512)
- how_to_test.md: Instructions for reviewers

Deployment:
1. Ensure Worker is deployed: `npx wrangler deploy`
2. Set Secrets:
   - `npx wrangler secret put OPENAI_API_KEY`
   - `npx wrangler secret put AGENT_ID`
   - `npx wrangler secret put OPENAI_VERIFICATION_TOKEN`
3. Verify endpoints using `run_tests.sh` locally or curl against the deployed URL.

Reviewer Notes:
Please refer to 'how_to_test.md' for details on the Agent-based architecture.
