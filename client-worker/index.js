
import { Agent } from "agents";

import { getCurrentAgent } from "agents";
export class MyAgent extends Agent {
  constructor(state, env) {
    super(state, env);
    this.initialized = false;

  }
  
  async fetch(paramRequest) {
    const { prompt } = await paramRequest.json();
    console.log('before mcp server ', this.mcp);
    
    // if (!this.initialized) {
      const connId = await this.addMcpServer("server-worker", this.env.MCP_SERVER_URL, "https://client-worker.raranj.workers.dev");
      await this.mcp.ready;
      console.log("mcpServer added", "server-worker", this.env.MCP_SERVER_URL);
      console.log("connection id: ", connId.id);

      const tools = await this.mcp.listTools();

      const normalizedTools = tools.map(tool => {
        const schema = JSON.parse(JSON.stringify(tool.inputSchema));  
        if (schema.$schema) delete schema.$schema;
        return {
          name: tool.name,
          description: tool.description,
          input_schema: schema
        };
      });

      console.log("TOOLS: ", tools);
      console.log("normTOOLS: ", normalizedTools);
      this.initialized = true;
    // }
    
    // return new Response(
    //   JSON.stringify({ msg: "returning early"}),
    //   { headers: { "content-type": "application/json" } }
    // );

    for (const tool of normalizedTools) {
      console.log(`🧰tool name: ${tool.name}: ${tool.description}`);
    }

    console.log('before env.AI.run  ');
    const result = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages: [
          { role: "user", content: prompt }
        ],
        tools: normalizedTools
      }
    );

    console.log('result: ', result);

    return new Response(
      JSON.stringify({ msg: "returning early"}),
      { headers: { "content-type": "application/json" } }
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













