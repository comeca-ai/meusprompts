
import assert from 'assert';

// Mock Environment
global.Response = class Response {
    constructor(body, options = {}) {
        this.body = body;
        this.status = options.status || 200;
        this.headers = options.headers || {};
    }
    async json() {
        return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
};

global.Request = class Request {
    constructor(url, options = {}) {
        this.url = url;
        this.method = options.method || 'GET';
        this.body = options.body;
    }
    async json() {
        return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
};

global.TransformStream = class TransformStream {
    constructor() {
        this.readable = "stream";
        this.writable = { getWriter: () => ({ write: () => {} }) };
    }
};

global.TextEncoder = class TextEncoder {
    encode(str) { return str; }
};

if (!global.crypto) {
    global.crypto = { randomUUID: () => 'mock-uuid-' + Math.random() };
}

// Mock Fetch for Agent Proxy
global.fetch = async (url, options) => {
    if (url.includes('chat/completions')) {
        return new Response(JSON.stringify({
            choices: [{ message: { content: "Optimized Prompt Result" } }]
        }), { status: 200 });
    }
    // Keep invoke mock if handleInvokeProxy still uses it
    if (url.includes('invoke')) {
         return new Response(JSON.stringify({ result: "Agent Analysis Result" }), { status: 200 });
    }
    return new Response("Not Found", { status: 404 });
};

async function runTests() {
    const workerModule = await import('../src/index.js');
    const worker = workerModule.default;
    
    // Mock Env without DB (triggering in-memory fallback)
    const env = {
        AGENT_ID: 'test-agent',
        OPENAI_API_KEY: 'test-key',
    };

    console.log("Running Meus Prompts tests...");
    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        try {
            await fn();
            console.log(`✅ ${name}`);
            passed++;
        } catch (e) {
            console.log(`❌ ${name}`);
            console.error(e);
            failed++;
        }
    }

    await test("1. List Tools", async () => {
        const req = new Request("http://localhost/mcp", {
            method: "POST",
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" })
        });
        const res = await worker.fetch(req, env);
        const data = await res.json();
        assert.strictEqual(data.result.tools.length, 5);
    });

    await test("2. Save Prompt", async () => {
        const req = new Request("http://localhost/mcp", {
            method: "POST",
            body: JSON.stringify({
                jsonrpc: "2.0", id: 2, method: "tools/call",
                params: {
                    name: "save_prompt",
                    arguments: { title: "Test Prompt", body: "Hello AI", tags: ["test"] }
                }
            })
        });
        const res = await worker.fetch(req, env);
        const data = await res.json();
        assert.ok(data.result.structuredContent.success);
        assert.strictEqual(data.result.structuredContent.prompt.title, "Test Prompt");
    });

    await test("3. List Prompts", async () => {
        const req = new Request("http://localhost/mcp", {
            method: "POST",
            body: JSON.stringify({
                jsonrpc: "2.0", id: 3, method: "tools/call",
                params: {
                    name: "list_prompts",
                    arguments: {}
                }
            })
        });
        const res = await worker.fetch(req, env);
        const data = await res.json();
        assert.ok(data.result.structuredContent.count > 0);
        assert.ok(data.result._meta["openai/widgetCSP"]); // Check CSP presence
    });

    console.log(`\nResults: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
}

runTests();
