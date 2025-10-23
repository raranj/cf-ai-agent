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

    var call = null;
    var args = null;
    var toolResult = null;
    if (result.tool_calls && result.tool_calls.length > 0) {
      call = result.tool_calls[0];
      console.log(`Calling tool: ${call.name} with`, call.arguments);
      args = call.parameters ?? call.arguments ?? {};
      console.log("connection id ONE: ", connId.id);
      toolResult = await this.mcp.callTool({name: call.name, arguments: args, serverId: connId.id});
      console.log('toolResult: ', toolResult);
    }

    var toolResultText = toolResult.content?.[0]?.text ?? JSON.stringify(toolResult);
    var finalResponse = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: `Calling tool ${call.name} with args ${JSON.stringify(args)}` },
        { role: "tool", name: call.name, content: toolResultText }        ]
    });

    console.log("Final response: " + finalResponse.response);
    return new Response(
      JSON.stringify({ msg: finalResponse.response }),
      { headers: { "Content-Type": "application/json" } }
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













