import { Agent } from "@cloudflare/agents";

export class MyAgent extends Agent {
  constructor(state, env) {
    super(state, env, {
      llm: {
        provider: "workers-ai",
        model: "@cf/meta/llama-3.1-8b-instruct",
        apiKey: env.WORKERS_AI_API_TOKEN,
      },
      mcp: {
        servers: [new URL(env.MCP_SERVER_URL)],
      },
    });
  }

  async onRequest(request, ctx) {
    const data = await request.json();
    const prompt = data.prompt || "Hello!";

    const result = await this.llm.respond(prompt);

    return new Response(JSON.stringify({ output: result.output_text }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
