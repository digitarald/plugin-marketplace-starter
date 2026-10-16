import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { BoardError } from "./board.mjs";

const page = await readFile(new URL("./index.html", import.meta.url));

async function readInput(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > 4096) throw new BoardError("Request is too large.");
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new BoardError("Send a valid JSON request.");
  }
}

export async function startServer(board, log = console.error) {
  const streams = new Set();
  const server = createServer((request, response) => {
    const json = (status, value) => {
      response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      response.end(JSON.stringify(value));
    };
    async function handle() {
      const address = server.address();
      const origin = `http://127.0.0.1:${address.port}`;
      // Check both Host and Origin to reject rebinding and cross-site writes.
      if (request.headers.host !== `127.0.0.1:${address.port}`
        || (request.headers.origin && request.headers.origin !== origin)) {
        return json(403, { error: "Only the board's own page may access this server." });
      }
      const path = request.url;
      if (request.method === "GET" && path === "/") {
        response.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'self'",
          "X-Content-Type-Options": "nosniff",
        });
        return response.end(page);
      }
      if (request.method === "GET" && path === "/board") return json(200, board.read());
      if (request.method === "GET" && path === "/events") {
        response.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store" });
        streams.add(response);
        const push = (value) => response.write(`data: ${JSON.stringify(value)}\n\n`);
        push(board.read());
        const unsubscribe = board.subscribe(push);
        request.on("close", () => { unsubscribe(); streams.delete(response); });
        return;
      }
      if (request.method === "POST" && path === "/notes") {
        if (!request.headers["content-type"]?.startsWith("application/json")) {
          return json(415, { error: "Send application/json." });
        }
        return json(200, board.save(await readInput(request)));
      }
      if (request.method === "POST" && path === "/remove") {
        if (!request.headers["content-type"]?.startsWith("application/json")) {
          return json(415, { error: "Send application/json." });
        }
        const input = await readInput(request);
        if (!input || Object.keys(input).length !== 1) throw new BoardError("Provide a note ID.");
        return json(200, board.remove(input.id));
      }
      json(404, { error: "Not found." });
    }
    handle().catch((error) => {
      if (!(error instanceof BoardError)) log(error);
      if (!response.headersSent) {
        json(error instanceof BoardError ? 400 : 500, {
          error: error instanceof BoardError ? error.message : "Board request failed. See extension logs.",
        });
      } else response.destroy();
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}/`,
    async close() {
      for (const stream of streams) stream.end();
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    },
  };
}
