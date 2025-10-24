export async function onRequestPost({ request, env }) {
  const rawBody = await request.text();

  const { prompt } = JSON.parse(rawBody);

  const response = await env.CLIENT_WORKER.fetch("https://agent/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }), 
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
    status: response.status
  });
}