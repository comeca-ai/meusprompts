
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Health check
    if (url.pathname === "/") {
      return new Response(JSON.stringify({ status: "ok", service: "Meus Prompts MCP" }));
    }

    // 2. Domain verification
    if (url.pathname === "/.well-known/openai-verification.txt") {
      return new Response(env.OPENAI_VERIFICATION_TOKEN || "TOKEN_OPENAI_AQUI");
    }

    // 3. MCP SSE endpoint
    if (url.pathname === "/sse") {
      return handleSSE(request, env);
    }

    // 4. MCP message endpoint
    if (url.pathname === "/sse/message" || url.pathname === "/mcp") {
      return handleMessage(request, env);
    }
    
    // 5. Direct Proxy to OpenAI Agents API
    if (url.pathname === "/invoke" && request.method === "POST") {
        return handleInvokeProxy(request, env);
    }

    // 6. REST API Endpoints (Bridging to Tools)
    if (url.pathname.startsWith("/prompts")) {
        return handleRestApi(request, env);
    }
    if (url.pathname === "/optimize" && request.method === "POST") {
        return handleOptimizeRest(request, env);
    }

    return new Response("Not Found", { status: 404 });
  }
};

// --- REST API Handlers ---

async function handleRestApi(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // GET /prompts or GET /prompts?tag=...
    if (path === "/prompts" && method === "GET") {
        const tag = url.searchParams.get("tag");
        const result = await handleDBTool("list_prompts", { tag }, env);
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
    }

    // POST /prompts
    if (path === "/prompts" && method === "POST") {
        try {
            const body = await request.json();
            const result = await handleDBTool("save_prompt", body, env);
            return new Response(JSON.stringify(result.prompt), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
            return new Response("Invalid JSON", { status: 400 });
        }
    }

    // GET /prompts/{id}
    if (path.startsWith("/prompts/") && method === "GET") {
        const id = path.split("/").pop();
        try {
            const result = await handleDBTool("get_prompt", { id }, env);
            return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
            return new Response("Not Found", { status: 404 });
        }
    }

    // DELETE /prompts/{id}
    if (path.startsWith("/prompts/") && method === "DELETE") {
        const id = path.split("/").pop();
        const result = await handleDBTool("delete_prompt", { id }, env);
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
    }

    return new Response("Method not allowed", { status: 405 });
}

async function handleOptimizeRest(request, env) {
    try {
        const body = await request.json();
        const result = await processWithAI("optimize_prompt", body, env);
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
    } catch (e) {
         return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}

// --- MCP Handlers ---

async function handleSSE(request, env) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  
  const body = `event: endpoint\ndata: /sse/message\n\n`;
  const encoder = new TextEncoder();
  writer.write(encoder.encode(body));
  
  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

async function handleMessage(request, env) {
  if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
  }
  
  try {
    const message = await request.json();
    
    if (message.jsonrpc !== "2.0") {
        return jsonRpcError(message.id, -32600, "Invalid Request");
    }
    
    if (message.method === "initialize") {
        return jsonRpcResponse(message.id, {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: {
                name: "meus-prompts-mcp",
                version: "1.0.0"
            }
        });
    }
    
    if (message.method === "notifications/initialized") {
        return new Response(null, { status: 200 });
    }

    if (message.method === "tools/list") {
        return jsonRpcResponse(message.id, {
            tools: TOOLS
        });
    }

    if (message.method === "tools/call") {
        const { name, arguments: args } = message.params;
        const tool = TOOLS.find(t => t.name === name);
        if (!tool) {
            return jsonRpcError(message.id, -32601, `Tool not found: ${name}`);
        }
        
        try {
            // Check if it's a "local" DB tool or an "Agent" tool
            let result;
            if (name === 'save_prompt' || name === 'list_prompts' || name === 'delete_prompt' || name === 'get_prompt') {
                result = await handleDBTool(name, args, env);
            } else {
                // Default to agent proxy for analysis tools
                result = await processWithAI(name, args, env);
            }
            
            return jsonRpcResponse(message.id, {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result) 
                    }
                ],
                structuredContent: result,
                _meta: {
                    // Inject widgetCSP if needed for UI rendering
                     "openai/widgetCSP": {
                        connect_domains: ["api.cloudflare.com"], // Example
                        resource_domains: [],
                        frame_domains: []
                      }
                }
            });
        } catch (err) {
            console.error(err);
            return jsonRpcError(message.id, -32603, `Internal error: ${err.message}`);
        }
    }

    return jsonRpcError(message.id, -32601, "Method not found");

  } catch (e) {
      return jsonRpcError(null, -32700, "Parse error");
  }
}

// --- DB Logic (Mocked for tests, D1 for prod) ---

// In-memory mock for local tests (since D1 binding is tricky in basic unit tests without miniflare)
// In a real worker environment, `env.DB` would be present.
let MOCK_DB = new Map();

async function handleDBTool(name, args, env) {
    // If env.DB exists (production/miniflare), use it. Else use mock.
    const useD1 = !!env.DB;

    if (name === 'save_prompt') {
        const { title, body, tags } = args;
        const id = crypto.randomUUID();
        const prompt = { id, title, body, tags: tags || [], created_at: new Date().toISOString() };
        
        if (useD1) {
            await env.DB.prepare(
                "INSERT INTO prompts (id, title, body, tags, created_at) VALUES (?, ?, ?, ?, ?)"
            ).bind(id, title, body, JSON.stringify(tags), prompt.created_at).run();
        } else {
            MOCK_DB.set(id, prompt);
        }
        return { success: true, prompt };
    }

    if (name === 'list_prompts') {
        const { tag } = args;
        let prompts = [];
        
        if (useD1) {
            let query = "SELECT * FROM prompts";
            const results = await env.DB.prepare(query).all();
            prompts = results.results.map(p => ({...p, tags: JSON.parse(p.tags)}));
        } else {
            prompts = Array.from(MOCK_DB.values());
        }

        if (tag) {
            prompts = prompts.filter(p => p.tags.includes(tag));
        }
        
        // Return rich structure for ChatKit/Widget
        return {
            prompts: prompts,
            count: prompts.length,
            view_type: "list"
        };
    }

    if (name === 'get_prompt') {
        const { id } = args;
        let prompt;
        if (useD1) {
             prompt = await env.DB.prepare("SELECT * FROM prompts WHERE id = ?").bind(id).first();
             if (prompt) prompt.tags = JSON.parse(prompt.tags);
        } else {
             prompt = MOCK_DB.get(id);
        }
        
        if (!prompt) throw new Error("Prompt not found");
        return prompt;
    }

    if (name === 'delete_prompt') {
        const { id } = args;
        if (useD1) {
            await env.DB.prepare("DELETE FROM prompts WHERE id = ?").bind(id).run();
        } else {
            MOCK_DB.delete(id);
        }
        return { success: true, id };
    }
}

// --- OpenAI Agent Proxy Logic ---

async function handleInvokeProxy(request, env) {
    // Proxies to OpenAI Chat Completions for generic "Agent" behavior
    const traceId = crypto.randomUUID();
    
    try {
        const body = await request.json();
        const { input } = body;
        
        if (!input) return new Response(JSON.stringify({ error: "Missing 'input' field" }), { status: 400 });

        const apiKey = env.OPENAI_API_KEY;
        if (!apiKey) {
             return new Response(JSON.stringify({ error: "Server configuration error: Missing credentials" }), { status: 500 });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); 

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "You are a helpful agent executing a request." },
                    { role: "user", content: input }
                ]
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            return new Response(JSON.stringify({
                error: "Upstream API Error",
                details: response.status,
                trace_id: traceId
            }), { status: response.status });
        }

        const data = await response.json();
        
        return new Response(JSON.stringify({
            result: { output: data.choices[0].message.content },
            trace_id: traceId
        }), { headers: { "Content-Type": "application/json" } });

    } catch (e) {
        return new Response(JSON.stringify({
            error: "Internal Server Error",
            message: e.message,
            trace_id: traceId
        }), { status: 500 });
    }
}

async function processWithAI(toolName, args, env) {
    // Uses standard Chat Completions API as a proxy for "Agent" intelligence
    const input = `Tool Call: ${toolName}\nArguments: ${JSON.stringify(args)}`;
    const apiKey = env.OPENAI_API_KEY;
    
    if (!apiKey) throw new Error("Missing configuration");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-4o", // Or env.MODEL
            messages: [
                { role: "system", content: "You are an AI assistant helping to optimize prompts." },
                { role: "user", content: input }
            ]
        })
    });

    if (!response.ok) throw new Error(`OpenAI API failed: ${response.status}`);
    const data = await response.json();
    
    // Return the content directly
    return {
        output: data.choices[0].message.content,
        agent_execution: true
    };
}

// --- Helper Functions ---

function jsonRpcResponse(id, result) {
    return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), { headers: { "Content-Type": "application/json" } });
}

function jsonRpcError(id, code, message, data) {
    return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message, data } }), { headers: { "Content-Type": "application/json" } });
}

// --- Tools Definition ---

const TOOLS = [
  {
    name: "save_prompt",
    title: "Salvar Prompt",
    description: "Use this to save a new prompt to the library.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title of the prompt" },
        body: { type: "string", description: "The full text of the prompt" },
        tags: { type: "array", items: { type: "string" }, description: "Tags for categorization" }
      },
      required: ["title", "body"]
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      openWorldHint: false
    }
  },
  {
    name: "list_prompts",
    title: "Listar Prompts",
    description: "Use this to retrieve saved prompts, optionally filtered by tag.",
    inputSchema: {
      type: "object",
      properties: {
        tag: { type: "string", description: "Filter prompts by this tag" }
      },
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    }
  },
  {
    name: "get_prompt",
    title: "Obter Prompt",
    description: "Get details of a specific prompt by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The ID of the prompt" }
      },
      required: ["id"]
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    }
  },
  {
    name: "delete_prompt",
    title: "Excluir Prompt",
    description: "Permanently remove a prompt.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The ID of the prompt to delete" }
      },
      required: ["id"]
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false
    }
  },
  {
    name: "optimize_prompt",
    title: "Otimizar Prompt",
    description: "Use AI to improve a prompt (Proxy to Agent).",
    inputSchema: {
      type: "object",
      properties: {
        prompt_text: { type: "string", description: "The prompt to optimize" },
        goal: { type: "string", description: "The goal of the optimization" }
      },
      required: ["prompt_text"]
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true
    }
  }
];
