import { MyAgent } from "./myAgent.js";

// --- Create the Agent instance once, outside fetch ---
let agent; // Will be initialized lazily when env is available

export default {
  async fetch(request, env, ctx) {
    // Initialize only once per worker instance
    if (!agent) {
      agent = new MyAgent({
        llm: {
          provider: "workers-ai",
          model: "@cf/meta/llama-3.1-8b-instruct",
          apiKey: env.WORKERS_AI_API_TOKEN,
        },
        mcp: {
          servers: [new URL(env.MCP_SERVER_URL)],
        },
      });
      console.log("Agent initialized");
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { prompt } = await request.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const result = await agent.llm.respond(prompt);
      return new Response(JSON.stringify({ output: result.output_text }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Agent error:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

export { MyAgent };
