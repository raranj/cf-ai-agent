// // functions/mcp.js
// export async function onRequest(context) {
//   const { request, env, waitUntil } = context;
//   const url = new URL(request.url);

//   // --- SSE endpoint ---
//   if (request.method === "GET" && url.pathname === "/mcp") {
//     const { readable, writable } = new TransformStream();
//     const writer = writable.getWriter();
//     const encoder = new TextEncoder();

//     // Keep-alive ping every 30s
//     const keepAlive = setInterval(() => writer.write(encoder.encode(":\n\n")), 30000);

//     waitUntil((async () => {
//       await writer.closed.catch(() => {});
//       clearInterval(keepAlive);
//     })());

//     return new Response(readable, {
//       headers: {
//         "Content-Type": "text/event-stream",
//         "Cache-Control": "no-cache",
//         "Connection": "keep-alive",
//       },
//     });
//   }

//   // --- JSON-RPC POST handler ---
//   if (request.method === "POST" && url.pathname === "/mcp") {
//     let body;
//     try {
//       body = await request.json();
//     } catch {
//       return new Response(JSON.stringify({ error: "Invalid JSON" }), {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     const { id = null, method, params } = body;

//     // ---- Initialize ----
//     if (method === "initialize") {
//       return new Response(
//         JSON.stringify({
//           jsonrpc: "2.0",
//           id,
//           result: {
//             protocolVersion: "2024-11-05",
//             serverInfo: { name: "DeviceMCP", version: "0.1.0" },
//             capabilities: { tools: {} },
//           },
//         }),
//         { headers: { "Content-Type": "application/json" } }
//       );
//     }

//     // ---- List tools ----
//     if (method === "tools/list") {
//       return new Response(
//         JSON.stringify({
//           jsonrpc: "2.0",
//           id,
//           result: {
//             tools: [
//               { name: "echo", description: "Echo input text", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
//               { name: "apps_on_device", description: "List apps on a device", inputSchema: { type: "object", properties: { device_id: { type: "string" } }, required: ["device_id"] } },
//               { name: "msoffice_versions", description: "Microsoft Office versions", inputSchema: { type: "object", properties: {}, required: [] } },
//               { name: "slack_vs_teams", description: "Slack vs Teams", inputSchema: { type: "object", properties: {}, required: [] } },
//               { name: "outdated_java_devices", description: "Devices with outdated Java", inputSchema: { type: "object", properties: {}, required: [] } },
//               { name: "browser_updates", description: "Devices needing browser updates", inputSchema: { type: "object", properties: {}, required: [] } },
//               { name: "unallowed_apps", description: "Devices with unallowed apps", inputSchema: { type: "object", properties: {}, required: [] } },
//               { name: "unencrypted_devices", description: "Devices without encryption", inputSchema: { type: "object", properties: {}, required: [] } },
//               { name: "no_autolock_devices", description: "Devices without auto-lock", inputSchema: { type: "object", properties: {}, required: [] } },
//               { name: "os_distribution", description: "OS distribution", inputSchema: { type: "object", properties: {}, required: [] } },
//               { name: "devices_needing_upgrade", description: "Count devices needing IS upgrade", inputSchema: { type: "object", properties: {}, required: [] } },
//             ],
//           },
//         }),
//         { headers: { "Content-Type": "application/json" } }
//       );
//     }

//     // ---- Call tools ----
//     if (method === "tools/call") {
//       const { name, arguments: args } = params || {};

//       // Helper for database queries: returns array of row objects
//       const runQuery = async (sql, binds = []) => {
//         const r = await env.devices_db.prepare(sql).bind(...binds).all();
//         return r?.results ?? [];
//       };

//       // ---- Echo ----
//       if (name === "echo") {
//         return new Response(
//           JSON.stringify({
//             jsonrpc: "2.0",
//             id,
//             result: { content: [{ type: "text", text: args?.text ?? "" }] },
//           }),
//           { headers: { "Content-Type": "application/json" } }
//         );
//       }

//       // ---- Applications on device ----
//       if (name === "apps_on_device") {
//         if (!args?.device_id) {
//           return new Response(
//             JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32602, message: "Missing device_id" } }),
//             { headers: { "Content-Type": "application/json" }, status: 400 }
//           );
//         }

//         const rows = await runQuery(
//           `SELECT a.name AS application_name, a.vendor, da.app_version, da.install_date, da.last_update, da.needs_update
//            FROM device_apps da
//            JOIN applications a ON da.app_id = a.app_id
//            WHERE da.device_id = ?`,
//           [args.device_id]
//         );

//         let outputText;
//         if (rows.length === 0) {
//           outputText = `No applications found for device ${args.device_id}.`;
//         } else {
//           let table = "| Application | Version | Vendor | Needs Update |\n|------------|---------|--------|--------------|\n";
//           rows.forEach((app) => {
//             table += `| ${app.application_name} | ${app.app_version} | ${app.vendor || ""} | ${app.needs_update ? "Yes" : "No"} |\n`;
//           });
//           outputText = table;
//         }

//         return new Response(
//           JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: outputText }] } }),
//           { headers: { "Content-Type": "application/json" } }
//         );
//       }

//       // ---- Microsoft Office versions ----
//       if (name === "msoffice_versions") {
//         const rows = await runQuery(
//           `SELECT da.device_id, da.app_version, da.last_update
//            FROM device_apps da
//            JOIN applications a ON da.app_id = a.app_id
//            WHERE a.name = 'Microsoft Office'`
//         );

//         let outputText;
//         if (rows.length === 0) {
//           outputText = "No devices with Microsoft Office found.";
//         } else {
//           let table = "| Device ID | Version | Last Update |\n|-----------|---------|-------------|\n";
//           rows.forEach((row) => {
//             table += `| ${row.device_id} | ${row.app_version} | ${row.last_update || ""} |\n`;
//           });
//           outputText = table;
//         }

//         return new Response(
//           JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: outputText }] } }),
//           { headers: { "Content-Type": "application/json" } }
//         );
//       }

//       // ---- Slack vs Teams ----
//       if (name === "slack_vs_teams") {
//         const rows = await runQuery(
//           `SELECT a.name AS application,
//                   COUNT(DISTINCT da.device_id) AS devices_with_app,
//                   ROUND(100.0 * COUNT(DISTINCT da.device_id) / (SELECT COUNT(*) FROM devices), 2) AS percentage_of_devices
//            FROM device_apps da
//            JOIN applications a ON da.app_id = a.app_id
//            WHERE a.name IN ('Slack', 'Microsoft Teams')
//            GROUP BY a.name`
//         );

//         let outputText;
//         if (rows.length === 0) {
//           outputText = "No devices with Slack or Teams found.";
//         } else {
//           let table = "| Application | Device Count | Percentage of Devices |\n|-------------|--------------|-----------------------|\n";
//           rows.forEach((row) => {
//             table += `| ${row.application} | ${row.devices_with_app} | ${row.percentage_of_devices}% |\n`;
//           });
//           outputText = table;
//         }

//         return new Response(
//           JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: outputText }] } }),
//           { headers: { "Content-Type": "application/json" } }
//         );
//       }

//       // ---- Outdated Java devices ----
//       if (name === "outdated_java_devices") {
//         const rows = await runQuery(
//           `SELECT d.device_id, da.app_version
//            FROM device_apps da
//            JOIN applications a ON da.app_id = a.app_id
//            JOIN devices d ON d.device_id = da.device_id
//            WHERE a.name = 'Java Runtime' AND da.needs_update = 1`
//         );

//         let outputText;
//         if (rows.length === 0) {
//           outputText = "No devices have outdated Java Runtime.";
//         } else {
//           let table = "| Device ID | Java Version |\n|-----------|--------------|\n";
//           rows.forEach((r) => { table += `| ${r.device_id} | ${r.app_version} |\n`; });
//           outputText = table;
//         }

//         return new Response(
//           JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: outputText }] } }),
//           { headers: { "Content-Type": "application/json" } }
//         );
//       }

//       // ---- Browser updates ----
//       if (name === "browser_updates") {
//         const rows = await runQuery(
//           `SELECT DISTINCT d.device_id, a.name AS browser_name, da.app_version
//            FROM device_apps da
//            JOIN applications a ON da.app_id = a.app_id
//            JOIN devices d ON d.device_id = da.device_id
//            WHERE a.category = 'Browser' AND da.needs_update = 1`
//         );

//         let outputText;
//         if (rows.length === 0) {
//           outputText = "All browsers are up to date.";
//         } else {
//           let table = "| Device ID | Browser | Version |\n|-----------|---------|---------|\n";
//           rows.forEach((r) => { table += `| ${r.device_id} | ${r.browser_name} | ${r.app_version} |\n`; });
//           outputText = table;
//         }

//         return new Response(
//           JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: outputText }] } }),
//           { headers: { "Content-Type": "application/json" } }
//         );
//       }

//       // ---- Unallowed applications ----
//       if (name === "unallowed_apps") {
//         const rows = await runQuery(
//           `SELECT DISTINCT d.device_id, a.name
//            FROM device_apps da
//            JOIN applications a ON da.app_id = a.app_id
//            JOIN devices d ON d.device_id = da.device_id
//            WHERE a.allowed = 0`
//         );

//         let outputText;
//         if (rows.length === 0) {
//           outputText = "No devices with unallowed apps.";
//         } else {
//           let table = "| Device ID | Unallowed App |\n|-----------|----------------|\n";
//           rows.forEach((r) => { table += `| ${r.device_id} | ${r.name} |\n`; });
//           outputText = table;
//         }

//         return new Response(
//           JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: outputText }] } }),
//           { headers: { "Content-Type": "application/json" } }
//         );
//       }

//       // ---- Unencrypted devices ----
//       if (name === "unencrypted_devices") {
//         const rows = await runQuery(
//           `SELECT device_id, hostname, username, department
//            FROM devices
//            WHERE is_encrypted = 0`
//         );

//         let outputText;
//         if (rows.length === 0) {
//           outputText = "All devices are encrypted.";
//         } else {
//           let table = "| Device ID | Hostname | User | Department |\n|-----------|----------|------|------------|\n";
//           rows.forEach((r) => { table += `| ${r.device_id} | ${r.hostname} | ${r.username} | ${r.department} |\n`; });
//           outputText = table;
//         }

//         return new Response(
//           JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: outputText }] } }),
//           { headers: { "Content-Type": "application/json" } }
//         );
//       }

//       // ---- No auto-lock devices ----
//       if (name === "no_autolock_devices") {
//         const rows = await runQuery(
//           `SELECT device_id, hostname, username, department
//            FROM devices
//            WHERE auto_lock_enabled = 0`
//         );

//         let outputText;
//         if (rows.length === 0) {
//           outputText = "All devices have auto-lock enabled.";
//         } else {
//           let table = "| Device ID | Hostname | User | Department |\n|-----------|----------|------|------------|\n";
//           rows.forEach((r) => { table += `| ${r.device_id} | ${r.hostname} | ${r.username} | ${r.department} |\n`; });
//           outputText = table;
//         }

//         return new Response(
//           JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: outputText }] } }),
//           { headers: { "Content-Type": "application/json" } }
//         );
//       }

//       // ---- OS distribution ----
//       if (name === "os_distribution") {
//         const totalRow = await runQuery(`SELECT COUNT(*) AS count FROM devices;`);
//         const total = totalRow[0]?.count ?? 0;
//         const rows = await runQuery(
//           `SELECT os, COUNT(*) * 100.0 / ? AS percentage
//            FROM devices
//            GROUP BY os`,
//           [total]
//         );

//         let outputText;
//         if (rows.length === 0) {
//           outputText = "No devices found.";
//         } else {
//           let table = "| OS | Percentage |\n|----|------------|\n";
//           rows.forEach((r) => { table += `| ${r.os} | ${Number(r.percentage).toFixed(1)}% |\n`; });
//           outputText = table;
//         }

//         return new Response(
//           JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: outputText }] } }),
//           { headers: { "Content-Type": "application/json" } }
//         );
//       }

//       // ---- Devices needing IS upgrade ----
//       if (name === "devices_needing_upgrade") {
//         const countRow = await runQuery(`SELECT COUNT(*) AS count FROM devices WHERE needs_is_upgrade = 1;`);
//         const count = countRow[0]?.count ?? 0;
//         const text = `${count} devices need an IS upgrade.`;

//         return new Response(
//           JSON.stringify({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text }] } }),
//           { headers: { "Content-Type": "application/json" } }
//         );
//       }

//       // Unknown tool
//       return new Response(
//         JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: "Unknown tool" } }),
//         { headers: { "Content-Type": "application/json" }, status: 400 }
//       );
//     }

//     // Method not found
//     return new Response(
//       JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } }),
//       { headers: { "Content-Type": "application/json" } }
//     );
//   }

//   return new Response("Not found", { status: 404 });
// }










import { Agent } from "@cloudflare/agents";

export async function onRequestPost(context) {
  const env = context.env;
  const { prompt, llm_provider, llm_model, mcp_url } = await context.request.json();

  if (!prompt || !llm_provider || !llm_model || !mcp_url) {
    return new Response(
      JSON.stringify({ error: "Missing prompt, llm_provider, llm_model, or mcp_url" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // ✅ Initialize Cloudflare Agent with provided LLM + MCP server URL
  const agent = new Agent({
    llm: {
      provider: llm_provider,
      model: llm_model,
      apiKey: env.LLM_API_KEY, // e.g., your OpenAI key
    },
    mcp: {
      servers: [mcp_url],
    },
  });

  try {
    // Ask the agent to respond (automatic tool orchestration)
    const result = await agent.respond(prompt);

    return new Response(
      JSON.stringify({
        answer: result.output_text,
        tools_used: result.tools_used,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}