export class MyAgent {
  constructor(state, env) {
    this.state = state; // holds durable object storage
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/state") {
      const stored = await this.state.storage.get("data");
      return new Response(JSON.stringify({ stored }), { status: 200 });
    }

    if (url.pathname === "/update") {
      const data = await request.json();
      await this.state.storage.put("data", data);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  }
}

export default {
  fetch(request, env) {
    return env.MY_AGENT.get(env.MY_AGENT.idFromName("main")).fetch(request);
  },
};
