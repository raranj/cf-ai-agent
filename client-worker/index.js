// import { MyAgent } from "./myAgent.js";

// // let stub; // Will be initialized lazily when env is available

// export default {
//   async fetch(request, env, ctx) {
//     // Initialize only once per worker instance
//     //if (!stub) {
//       const id = env.MY_AGENT.idFromName("mcpClientDO");
//       const stub = env.MY_AGENT.get(id);
//       // return stub.fetch(request);

//       // agent = new env.MY_AGENT(null, env, {
//       //   llm: {
//       //     provider: "workers-ai",
//       //     model: "@cf/meta/llama-3.1-8b-instruct",
//       //     apiKey: env.WORKERS_AI_API_TOKEN,
//       //   },
//       //   mcp: {
//       //     servers: [new URL(env.MCP_SERVER_URL)],
//       //   },
//       // });
//     // }
//     console.log("Agent initialized");
//     console.log("Exported keys:", Object.keys(globalThis));
//     console.log(MyAgent);
//     console.log("Exports from module:", Object.keys(await import("./index.js")));
//     return stub.fetch(request);

    // if (request.method !== "POST") {
    //   return new Response("Method Not Allowed", { status: 405 });
    // }

    // const { prompt } = await request.json();
    // if (!prompt) {
    //   return new Response(JSON.stringify({ error: "Missing prompt" }), {
    //     status: 400,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

    // try {
    //   const result = await agent.llm.respond(prompt);
    //   return new Response(JSON.stringify({ output: result.output_text }), {
    //     headers: { "Content-Type": "application/json" },
    //   });
    // } catch (err) {
    //   console.error("Agent error:", err);
    //   return new Response(JSON.stringify({ error: err.message }), {
    //     status: 500,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }
//   },
// };

// export { MyAgent };


import { Agent } from "@cloudflare/agents";
export class MyAgent extends Agent {
    constructor(state, env) {
      super(state, env, {
        llm: {
          provider: "workers-ai",
          model: "@cf/meta/llama-3.1-8b-instruct",
          apiKey: env.WORKERS_AI_API_TOKEN,
        }
        // mcp: {
        //   servers: [new URL(env.MCP_SERVER_URL)],
        // },

      });
  }
  async fetch(request) {
    console.log("LLM object:", this.llm);

    const { prompt } = await request.json();
    // const textRequest = await request.text();
    // console.log('Request Text:' + textRequest);
    const result = await this.llm.invoke(prompt);
    // const rawBody = await result.text();
    // console.log("LLM Response:", rawBody);
    // return new Response(JSON.stringify({ msg: result }), {
    //   headers: { "Content-Type": "application/json" },
    // });

    return new Response(
      JSON.stringify({ msg: result.output_text ?? "" }),
      { headers: { "content-type": "application/json" } }
    );

    // return new Response(JSON.stringify({ message: "Hello from MyAgent!" }), {
    //   headers: { "Content-Type": "application/json" },
    // });
  }
}

export default {
  async fetch(req, env) {
    const id = env.MY_AGENT.idFromName("singleton");
    const stub = env.MY_AGENT.get(id);
    return stub.fetch(req.clone());
  }
};
