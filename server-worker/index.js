export default {
  async fetch(request, env, ctx) {
    // This is the entry point for the worker.
    // We are calling your existing MCP logic and passing along the context.
    return await handleRequest({ request, env, waitUntil: ctx.waitUntil });
  }
};

async function handleRequest({ request, env, waitUntil }) {
  const url = new URL(request.url);

  // --- SSE endpoint ---
  if (request.method === "GET" && url.pathname === "/mcp") {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Keep-alive ping every 30s
    const keepAlive = setInterval(() => writer.write(encoder.encode(":\n\n")), 30000);

    waitUntil((async () => {
      await writer.closed.catch(() => {});
      clearInterval(keepAlive);
    })());

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }

  if (request.method === "GET" && url.pathname === "/") {
    return new Response("MCP server is running!", {
      headers: { "content-type": "text/plain" },
    });
  }

  // --- JSON-RPC POST handler ---
  if (request.method === "POST" && (url.pathname === "/mcp" || url.pathname === "/")) {
    let body;
    try {
      body = await request.json();
      console.log('Request: ' + body);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id = null, method, params } = body;
    console.log('Method: ' + method);
    console.log('Params: ' + params);

    // ---- Initialize ----
    if (method === "initialize") {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            serverInfo: { name: "DeviceMCP", version: "0.1.0" },
            capabilities: { tools: {} },
          },
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (method === "notifications/initialized") {
      console.log("✅ MCP client initialized — session is ready.");
      return new Response(null, { status: 204 });
    }

    // ---- List tools ----
    if (method === "tools/list") {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: {
            tools: [
              { name: "echo", description: "Echo input text", inputSchema: { "$schema": "http://json-schema.org/draft-07/schema#", type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
              { name: "apps_on_device", description: "List apps on a device", inputSchema: { "$schema": "http://json-schema.org/draft-07/schema#", type: "object", properties: { device_id: { type: "string" } }, required: ["device_id"] } },
              { name: "msoffice_versions", description: "Microsoft Office versions", inputSchema: { "$schema": "http://json-schema.org/draft-07/schema#", type: "object", properties: {}, required: [] } },
              { name: "slack_vs_teams", description: "Slack vs Teams", inputSchema: { "$schema": "http://json-schema.org/draft-07/schema#", type: "object", properties: {}, required: [] } },
              { name: "outdated_java_devices", description: "Devices with outdated Java", inputSchema: { "$schema": "http://json-schema.org/draft-07/schema#", type: "object", properties: {}, required: [] } },
              { name: "browser_updates", description: "Devices needing browser updates", inputSchema: { "$schema": "http://json-schema.org/draft-07/schema#", type: "object", properties: {}, required: [] } },
              { name: "unallowed_apps", description: "Devices with unallowed apps", inputSchema: { "$schema": "http://json-schema.org/draft-07/schema#", type: "object", properties: {}, required: [] } },
              { name: "unencrypted_devices", description: "Devices without encryption", inputSchema: { "$schema": "http://json-schema.org/draft-07/schema#", type: "object", properties: {}, required: [] } },
              { name: "no_autolock_devices", description: "Devices without auto-lock", inputSchema: { "$schema": "http://json-schema.org/draft-07/schema#", type: "object", properties: {}, required: [] } },
              { name: "os_distribution", description: "OS distribution", inputSchema: { "$schema": "http://json-schema.org/draft-07/schema#", type: "object", properties: {}, required: [] } },
              { name: "devices_needing_upgrade", description: "Count devices needing IS upgrade", inputSchema: { "$schema": "http://json-schema.org/draft-07/schema#", type: "object", properties: {}, required: [] } },
            ],
          },
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ---- Call tools ----
    if (method === "tools/call") {
      const { name, arguments: args } = params || {};

      // Helper for database queries: returns array of row objects
      const runQuery = async (sql, binds = []) => {
        const r = await env.devices_db.prepare(sql).bind(...binds).all();
        return r?.results ?? [];
      };

      // Your tool implementations (echo, apps_on_device, etc.) go here...
    }

    // Method not found
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response("Not found", { status: 404 });
}