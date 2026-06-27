import { DurableObject } from "cloudflare:workers";

export class UserRoom extends DurableObject {
  private connections: WebSocket[] = [];
  private pendingMessages: string[] = [];

  async fetch(request: Request) {
    if (request.headers.get("Upgrade") === "websocket") {
      const [client, server] = Object.values(new WebSocketPair());
      server.accept();
      this.connections.push(server);

      // Flush any pending messages from when user was offline
      if (this.pendingMessages.length > 0) {
        for (const msg of this.pendingMessages) {
          try { server.send(msg); } catch { break; }
        }
        this.pendingMessages = [];
      }

      server.addEventListener("close", () => {
        this.connections = this.connections.filter((c) => c !== server);
      });

      server.addEventListener("message", (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type === "ping") {
            server.send(JSON.stringify({ type: "pong" }));
          }
        } catch { /* ignore malformed */ }
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    const { type, data, username } = (await request.json()) as {
      type: string;
      data: unknown;
      username?: string;
    };
    const message = JSON.stringify({ type, data });

    // Deliver to all connected clients
    let delivered = false;
    for (const ws of this.connections) {
      try {
        ws.send(message);
        delivered = true;
      } catch {
        this.connections = this.connections.filter((c) => c !== ws);
      }
    }

    // Store for delivery when user reconnects
    if (!delivered) {
      this.pendingMessages.push(message);
      if (this.pendingMessages.length > 50) {
        this.pendingMessages.shift();
      }
    }

    return new Response("ok");
  }
}
