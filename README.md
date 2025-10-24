# MCP Agent with Cloudflare Workers

A Model Context Protocol (MCP) implementation using Cloudflare Workers AI, demonstrating agent-based architecture with tool calling capabilities for device management queries.

## Demo

**Live Demo:** [https://cf-ai-agent.pages.dev](https://cf-ai-agent.pages.dev)

**Video Walkthrough:** [Link to video demonstration]

![Application Screenshot](./docs/screenshot.png)

## Overview

This project implements a complete MCP (Model Context Protocol) server-client architecture using Cloudflare's edge infrastructure. It features:

- **MCP Server Worker**: Exposes device management tools via MCP protocol
- **MCP Client Worker**: Durable Object-based agent that connects to the MCP server and processes queries using Cloudflare AI
- **Cloudflare Pages Frontend**: Simple web interface for asking questions about device inventory
- **D1 Database**: Cloudflare D1 database storing device and application information

## Architecture

```
┌─────────────────┐
│   Web Browser   │
│   (Frontend)    │
└────────┬────────┘
         │ HTTP POST /api/ask
         ▼
┌─────────────────────────────┐
│  Cloudflare Pages Function  │
│   (functions/api/ask.js)    │
└────────────┬────────────────┘
             │ Fetch to CLIENT_WORKER
             ▼
┌──────────────────────────────────┐
│   Client Worker (Durable Object) │
│   - MyAgent extends Agent        │
│   - Manages MCP connection       │
│   - Calls Cloudflare AI          │
└────────────┬─────────────────────┘
             │ MCP Protocol (SSE/HTTP)
             ▼
┌───────────────────────────────┐
│   Server Worker (MCP Server)  │
│   - Implements MCP protocol   │
│   - Provides 11+ tools        │
│   - Queries D1 database       │
└────────────┬──────────────────┘
             │ SQL Queries
             ▼
┌───────────────────────────────┐
│   Cloudflare D1 Database      │
│   - devices table             │
│   - applications table        │
│   - device_apps table         │
└───────────────────────────────┘
```

## Available MCP Tools

The MCP server provides these tools for device management:

1. **echo** - Echo test tool
2. **add_numbers** - Add two numbers (demo tool)
3. **apps_on_device** - List all applications installed on a specific device
4. **msoffice_versions** - Show Microsoft Office versions across all devices
5. **slack_vs_teams** - Compare Slack vs Teams adoption
6. **outdated_java_devices** - Find devices with outdated Java Runtime
7. **browser_updates** - Find devices needing browser updates
8. **unallowed_apps** - Find devices with unauthorized applications
9. **unencrypted_devices** - List unencrypted devices
10. **no_autolock_devices** - List devices without auto-lock enabled
11. **os_distribution** - Show OS distribution across devices
12. **devices_needing_upgrade** - Count devices needing IS upgrades

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd <project-directory>
npm install
cd client-worker && npm install && cd ..
```

### 2. Set Up D1 Database

Create the D1 database:

```bash
wrangler d1 create devices_db
```

Update the `database_id` in `server-worker/wrangler.toml` with the ID returned from the command above.

Initialize the database with schema and seed data:

```bash
wrangler d1 execute devices_db --file=./schema.sql --remote
```

### 3. Deploy the Server Worker

```bash
cd server-worker
wrangler deploy
cd ..
```

Note the deployed URL (e.g., `https://server-worker.YOUR_SUBDOMAIN.workers.dev`)

### 4. Deploy the Client Worker

Update `client-worker/wrangler.toml` with your server worker URL:

```toml
[vars]
MCP_SERVER_URL = "https://server-worker.YOUR_SUBDOMAIN.workers.dev"
```

Deploy the client worker:

```bash
cd client-worker
wrangler deploy
cd ..
```

Note the deployed URL (e.g., `https://client-worker.YOUR_SUBDOMAIN.workers.dev`)

### 5. Deploy the Pages Application

Update `wrangler.toml` with your client worker service name:

```toml
[[services]]
binding = "CLIENT_WORKER"
service = "client-worker"  # Use your actual service name
```

Deploy to Cloudflare Pages:

```bash
wrangler pages deploy . --project-name=cf-ai-agent
```

## Usage Examples

Once deployed, you can ask natural language questions like:

- "What apps are installed on device dev-001?"
- "Which devices need browser updates?"
- "Show me the OS distribution across all devices"
- "List all devices without encryption"
- "Compare Slack and Teams adoption"
- "How many devices need an IS upgrade?"

The agent will:
1. Receive your question via the web interface
2. Use Cloudflare AI (Llama 3.3 70B) to understand the query
3. Call the appropriate MCP tool(s)
4. Return formatted results

## 📊 Sample Data

The database includes:

- **8 devices** across different departments (Engineering, Sales, HR, Finance, Support)
- **10 applications** (mix of allowed/unallowed software)
- Various compliance scenarios (encryption, auto-lock, outdated software)

## 🛠️ Technologies Used

- **Cloudflare Workers** - Serverless compute platform
- **Cloudflare Durable Objects** - Stateful agent management
- **Cloudflare D1** - SQLite-based edge database
- **Cloudflare Pages** - Static site hosting
- **Cloudflare AI** - LLM inference (Llama 3.3 70B)
- **MCP Protocol** - Model Context Protocol for tool calling
- **Agents SDK** - Cloudflare's agent framework

## 📁 Project Structure

```
.
├── client-worker/          # Durable Object agent worker
│   ├── index.js           # Agent implementation
│   ├── package.json
│   └── wrangler.toml
├── server-worker/         # MCP server worker
│   ├── index.js          # MCP protocol implementation
│   └── wrangler.toml
├── functions/
│   └── api/
│       └── ask.js        # Pages function endpoint
├── index.html            # Frontend interface
├── schema.sql            # Database schema and seed data
├── wrangler.toml         # Pages configuration
├── package.json
└── README.md
```

## 🔍 How It Works

1. **User submits a question** through the web interface
2. **Pages Function** (`/api/ask`) forwards the request to the Client Worker
3. **Client Worker** (Durable Object):
   - Establishes MCP connection with Server Worker if not already connected
   - Lists available tools from the MCP server
   - Sends the question to Cloudflare AI with available tools
4. **Cloudflare AI** decides which tool to call based on the question
5. **Client Worker** calls the selected MCP tool
6. **Server Worker** executes the tool (queries D1 database)
7. **Results** are returned through the chain back to the user

## 🎯 Key Features

- **Edge-native architecture** - Runs entirely on Cloudflare's edge network
- **Stateful agents** - Durable Objects maintain MCP connections
- **Natural language interface** - Ask questions in plain English
- **Tool calling** - AI automatically selects appropriate tools
- **Real-time data** - Queries live D1 database
- **Scalable** - Serverless architecture scales automatically

## 🐛 Troubleshooting

### Agent doesn't respond
- Check that both workers are deployed and accessible
- Verify the MCP_SERVER_URL in client-worker/wrangler.toml
- Check Wrangler logs: `wrangler tail <worker-name>`

### Database errors
- Ensure D1 database is created and initialized with schema.sql
- Verify database_id in server-worker/wrangler.toml
- Check D1 database: `wrangler d1 execute devices_db --command="SELECT * FROM devices" --remote`

### Tool not found errors
- Ensure server worker is returning tools in the correct MCP format
- Check that tool names match between server and AI responses

## Author

[Ranjana Rajagopalan]