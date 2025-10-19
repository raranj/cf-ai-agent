// import { Agent } from "@cloudflare/agents";
// export class MyAgent extends Agent {
//     constructor(state, env) {
//       super(state, env, {
//         llm: {
//           provider: "workers-ai",
//           model: "@cf/meta/llama-3.1-8b-instruct",
//           // apiKey: env.WORKERS_AI_API_TOKEN,
//         }
//         // mcp: {
//         //   servers: [new URL(env.MCP_SERVER_URL)],
//         // },

//       });
//   }

//   async fetch(request) {
//     console.log("LLM object:", this.llm);
//     console.log("Type of this.llm:", typeof this.llm);
//     console.log("this.llm is", this.llm === undefined ? "undefined" : "defined");
//     if (this.llm) {
//       console.log("LLM provider:", this.llm.provider);
//     } else {
//       console.log("LLM is undefined");
//     }

//     const { prompt } = await request.json();
//     // const textRequest = await request.text();
//     // console.log('Request Text:' + textRequest);

//     // const result = await this.llm.invoke(prompt);

//     const result = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
//       prompt: prompt,
//     });
//     // const rawBody = await result.text();
//     // console.log("LLM Response:", rawBody);
//     // return new Response(JSON.stringify({ msg: result }), {
//     //   headers: { "Content-Type": "application/json" },
//     // });

//     return new Response(
//       JSON.stringify({ msg: result.response ?? "" }),
//       { headers: { "content-type": "application/json" } }
//     );

//     // return new Response(JSON.stringify({ message: "Hello from MyAgent!" }), {
//     //   headers: { "Content-Type": "application/json" },
//     // });
//   }
// }



// import { Agent, createWorkersAI } from "agents";
// export class MyAgent extends Agent {
//   constructor(state, env) {
//     super(state, env);
//     // ✅ explicitly create an LLM interface
//     this.llm = createWorkersAI(env.AI, {
//       model: "@cf/meta/llama-3.1-8b-instruct"
//     });
//   }

//   async fetch(request) {
//     const { prompt } = await request.json();

//     console.log('This LLM: ' + this.llm);
//     const result = await this.llm.invoke(prompt);
    

//     console.log("AI result:", result);
//     return new Response(result.output_text, {
//       headers: { "content-type": "text/plain" }
//     });
//   }
// }



// export default {
//   async fetch(req, env) {
//     const id = env.MY_AGENT.idFromName("singleton");
//     const stub = env.MY_AGENT.get(id);
//     return stub.fetch(req.clone());
//   }
// };





// import { MCPClientManager } from "agents";
import { Agent } from "agents";

import { getCurrentAgent } from "agents";
export class MyAgent extends Agent {
  constructor(state, env) {
    // super(state, env, {
    //   llm: {
    //     provider: "workers-ai",
    //     model: "@cf/meta/llama-3.1-8b-instruct",
    //     // apiKey: env.WORKERS_AI_API_TOKEN,
    //   },
    //   mcp: {
    //     servers: [new URL(env.MCP_SERVER_URL)],
    //   }
    // });
    super(state, env);
    this.initialized = false;

  }
  
  async fetch(paramRequest) {
    const { prompt } = await paramRequest.json();
        // console.log('THIS LLM: ' + this.llm)
    console.log('before mcp server ' + this.mcp);

    // const mcpClient = new MCPClientManager({
    //   servers: [new URL(env.MCP_SERVER_URL)],
    // });
    // await mcpClient.connect();

    // const { tmpRequest } = getCurrentAgent();
    const { request } = getCurrentAgent();
    if (!request) {
        console.log("Request context undefined")
    } else {
        console.log("Request context present")
    }
    console.log("Request context?", request ? "present" : "undefined");
    
    await this.addMcpServer("server-worker", this.env.MCP_SERVER_URL);
    console.log("mcpServer added", "server-worker", this.env.MCP_SERVER_URL);
    this.initialized = true;

    // await this.addMcpServer("server-worker", this.env.MCP_SERVER_URL, "http://localhost:5173")
      // .then(() => {
      //   console.log("mcpServer added", "server-worker", this.env.MCP_SERVER_URL);
      // }) 
      // .catch((error) => {
      //   console.error("mcpServer addition failed", error);
      // });

    console.log('after mcp server ' + this.mcp);
    console.log('this.mcp.listTools(): ' + this.mcp.listTools);
    const tools = await Object.values(this.mcp.getAITools());;
    console.log('TOOLS: ' + tools);

    for (const tool of tools) {
      console.log(`🧰 ${tool.name}: ${tool.description}`);
    }

    console.log('before env.AI.run  ');
    const result = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct",
      {
        messages: [
          { role: "user", content: prompt }
        ],
        tools: tools
      }
    );
    
    // const result = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    //   prompt: prompt,
    // });
    // const result = await this.env.AI.run(prompt);
    console.log('output: ' + result.response );
    return new Response(
      JSON.stringify({ msg: result.response ?? ""}),
      { headers: { "content-type": "application/json" } }
    );
  }
}

export default {
  async fetch(req, env) {
    const id = env.MY_AGENT.idFromName("singleton");
    const stub = env.MY_AGENT.get(id);
    stub.setName("singleton");
    return stub.fetch(req.clone());
  },
};













