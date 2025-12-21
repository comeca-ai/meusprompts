# UI/UX Guide: Integration with OpenAI Widgets

This document describes how the "Meus Prompts" product utilizes OpenAI's Widget/Canvas capabilities (referred to as "ChatKit" integration in project discussions).

## 1. Structured Content Protocol

The MCP Server returns `structuredContent` in every tool response. The UI Layer (OpenAI Client) is expected to render this data.

### List Prompts Widget
**Tool:** `list_prompts`
**Data Structure:**
```json
{
  "prompts": [
    {
      "id": "uuid",
      "title": "SEO Generator",
      "tags": ["marketing", "seo"],
      "created_at": "2024-..."
    }
  ],
  "view_type": "list"
}
```
**Rendering:** The client should render a clickable list. Clicking an item should trigger the `get_prompt` tool with the respective ID.

### Save Confirmation Widget
**Tool:** `save_prompt`
**Data Structure:**
```json
{
  "success": true,
  "prompt": { ... }
}
```
**Rendering:** A "Toast" or success card showing the saved title.

## 2. Content Security Policy (CSP)

The App declares the following CSP in `_meta` to allow rendering:
```javascript
"openai/widgetCSP": {
  "connect_domains": ["api.cloudflare.com"], 
  "resource_domains": [],
  "frame_domains: []
}
```
This ensures the widget can fetch necessary assets if extended in the future.

## 3. Future "ChatKit" Extensions

If moving to a custom standalone frontend using OpenAI ChatKit API:
1.  **Session:** Initialize a ChatKit session pointing to this Agent.
2.  **Rendering:** The custom frontend must listen for `function_call` results and parse the JSON from our MCP to render React components (Cards, Lists).
