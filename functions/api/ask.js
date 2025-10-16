export async function onRequestPost({ request, env }) {
  // 1. Get the public URL of the client-worker from an environment variable.
  // const clientWorkerUrl = env.CLIENT_WORKER;

  // Optional: Log the URL for debugging.
  // console.log(`Forwarding POST request to: ${clientWorkerUrl}`);

  // if (!clientWorkerUrl) {
  //   return new Response("CLIENT_WORKER_URL is not configured.", { status: 500 });
  // }

  // 2. Create a new POST request to forward to the client-worker's URL.
  //    We create a new Request object to pass along the body and headers.
  // console.log(Object.keys(context.env));
  const rawBody = await request.text();
  console.log("📦 Body:", rawBody);

  const { prompt } = JSON.parse(rawBody);
  // const response = await env.CLIENT_WORKER.fetch("https://dummy-url", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(body),
  // });

  const response = await env.CLIENT_WORKER.fetch("https://agent/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }), 
  });

  // console.log("Response:", response.clone().json());
  // return response;

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
    status: response.status
  });
}