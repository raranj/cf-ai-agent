import { Agent } from "agents";

import { getCurrentAgent } from "agents";
export class MyAgent extends Agent {
  constructor(state, env) {
    super(state, env);
    this.connId = "";
    this.tools = null;
  }
  
  async fetch(paramRequest) {
    const { prompt } = await paramRequest.json();
    
    var conn = null;
    if (this.connId != "") {
      conn = this.mcp.mcpConnections[this.connId];
    }

    var connId = null;
    if (!conn || !conn.client || !this.tools || this.tools.length === 0) {

      connId = await this.addMcpServer("server-worker", this.env.MCP_SERVER_URL, "https://client-worker.raranj.workers.dev");
      await this.mcp.ready;
      this.connId = connId.id;
      console.log("connection id: ", this.connId);

      const tools = await this.mcp.listTools();
      await this.mcp.ready;

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
      this.tools = normalizedTools;
    }

    console.log('before env.AI.run  ');
    const result = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        context: "",
        messages: [
          { role: "user", content: prompt }
        ],
        tools: this.tools,
      }
    );

    console.log('result: ', result);
    console.log('Tool Calls: ', result.tool_calls);
    var call = null;
    var args = null;
    var toolResult = null;
    if (result.tool_calls && result.tool_calls.length > 0) {
      call = result.tool_calls[0];
      console.log(`Calling tool: ${call.name} with`, call.arguments);

      args = call.parameters ?? call.arguments ?? {};
      toolResult = await this.mcp.callTool({name: call.name, arguments: args, serverId: this.connId});
      console.log('toolResult: ', toolResult);

      var toolResultText = toolResult.content?.[0]?.text ?? JSON.stringify(toolResult);
      var finalResponse = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        context: "",
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

    return new Response(
        JSON.stringify({ msg: "No Response from Server" }),
        { headers: { "Content-Type": "application/json" } }
      );
  }
}

export default {
  async fetch(req, env) {
    const id = env.MY_AGENT.idFromName("singleton1");
    const stub = env.MY_AGENT.get(id);
    stub.setName("singleton1");
    return stub.fetch(req.clone());
  },
};













