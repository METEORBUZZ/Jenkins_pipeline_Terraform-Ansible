# 💬 Real-Time Node.js WebSocket Chat Application

A high-performance, real-time chat application powered by **Node.js, Express, and native WebSockets (`ws`)**, designed to be deployed and managed via the **Jenkins + Terraform + Ansible** CI/CD pipeline.

---

## ✨ Features

- **Full-Duplex WebSockets**: Native bidirectional event-driven communication via RFC 6455.
- **Zero Heavy Frontend Dependencies**: Uses the browser's native `window.WebSocket` API.
- **Real-Time Features**:
  - Live message broadcasting with timestamps and unique user color avatars.
  - Active user count and online user directory synchronization.
  - Live typing indicator ("Alice is typing...").
  - System join/leave notices.
  - Recent message history buffer (last 50 messages retained for newly joined clients).
  - Quick emoji reactions (🚀, 🔥, 👍, ❤️, 🎉, 💻).
- **Production-Ready**:
  - `/health` endpoint for CI/CD smoke tests and load balancers.
  - Heartbeat ping-pong mechanism (30-second interval) to prune dead sockets.
  - Graceful shutdown (`SIGINT` / `SIGTERM`) support.
  - Auto-reconnect with exponential backoff on client network disruption.

---

## 🏃 Local Run & Testing

To run the chat application locally on your machine:

```bash
cd chat-app

# 1. Install dependencies
npm install

# 2. Start the server
npm start
# or for auto-reload during development:
npm run dev
```

Visit **`http://localhost:3000`** in your browser. Open multiple tabs or windows to simulate multiple users chatting in real time!

---

## 🌐 Production Architecture (EC2 + Nginx + Systemd)

When deployed via Ansible:

```
[User Browser]
       │
       ▼ (Port 80 HTTP / WS Handshake)
[Nginx Reverse Proxy]
       │ proxy_set_header Upgrade $http_upgrade;
       │ proxy_set_header Connection "upgrade";
       ▼ (Port 3000 Localhost)
[Node.js WebSocket Server (chat-app.service)]
```

### Why Nginx with WebSockets?
HTTP/1.1 connections upgrade to WebSocket protocol using the `Upgrade: websocket` and `Connection: Upgrade` request headers. Nginx terminates client connections, handles SSL/TLS termination, and proxies persistent full-duplex TCP streams directly to the Node.js backend.

