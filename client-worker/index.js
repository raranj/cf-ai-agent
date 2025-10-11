import { Agent } from "@cloudflare/agents";
export class MyAgent extends Agent {}

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return new Response("OK", { status: 200 });
    }
    // if (request.method !== 'POST') {
    //   return new Response('Method Not Allowed', { status: 405 });
    // }

    const { prompt } = await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`before the agent`);
    const agent = new MyAgent({
      llm: {
        provider: "workers-ai",
        model: "@cf/meta/llama-3.1-8b-instruct",
        apiKey: env.WORKERS_AI_API_TOKEN,
      },
      mcp: {
        servers: [new URL(env.MCP_SERVER_URL)],
      },
    });

    try {
      const result = await agent.respond(prompt);
      return new Response(JSON.stringify({ answer: result.output_text }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};