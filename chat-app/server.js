const http = require('http');
const path = require('path');
const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint for CI/CD monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    activeConnections: wss.clients.size,
    timestamp: new Date().toISOString()
  });
});

// Color palette for user badges
const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#10b981',
  '#f59e0b', '#06b6d4', '#6366f1', '#14b8a6'
];

function getRandomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// In-memory message history buffer (last 50 messages)
const MAX_HISTORY = 50;
const messageHistory = [];

// Broadcast helper function
function broadcast(payload, excludeWs = null) {
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Broadcast current online user list
function broadcastUserList() {
  const users = [];
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.username) {
      users.push({
        id: client.id,
        username: client.username,
        color: client.color
      });
    }
  });
  broadcast({
    type: 'USER_LIST',
    count: users.length,
    users
  });
}

// WebSocket Connection Handler
wss.on('connection', (ws, req) => {
  ws.id = crypto.randomUUID();
  ws.username = null;
  ws.color = getRandomColor();
  ws.isAlive = true;

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[WebSocket] New client connected: ${ws.id} from ${clientIp}`);

  // Heartbeat ping-pong
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Handle incoming messages
  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      switch (data.type) {
        case 'JOIN': {
          const rawName = (data.username || '').trim();
          ws.username = rawName.slice(0, 25) || `User-${ws.id.slice(0, 4)}`;

          // Send welcome acknowledgment + message history to the newly joined client
          ws.send(JSON.stringify({
            type: 'WELCOME',
            id: ws.id,
            username: ws.username,
            color: ws.color,
            history: messageHistory
          }));

          // Notify others
          broadcast({
            type: 'SYSTEM',
            text: `${ws.username} joined the chat`,
            timestamp: new Date().toISOString()
          }, ws);

          broadcastUserList();
          break;
        }

        case 'MESSAGE': {
          if (!ws.username) return;

          const text = (data.text || '').trim();
          if (!text || text.length > 1000) return;

          const msgPayload = {
            type: 'MESSAGE',
            id: crypto.randomUUID(),
            userId: ws.id,
            username: ws.username,
            color: ws.color,
            text,
            timestamp: new Date().toISOString()
          };

          // Store in history
          messageHistory.push(msgPayload);
          if (messageHistory.length > MAX_HISTORY) {
            messageHistory.shift();
          }

          // Broadcast to everyone including sender
          broadcast(msgPayload);
          break;
        }

        case 'TYPING': {
          if (!ws.username) return;
          broadcast({
            type: 'TYPING',
            userId: ws.id,
            username: ws.username,
            isTyping: Boolean(data.isTyping)
          }, ws);
          break;
        }

        default:
          console.warn(`[WebSocket] Unknown message type: ${data.type}`);
      }
    } catch (err) {
      console.error('[WebSocket] Error processing message:', err.message);
    }
  });

  // Disconnect handler
  ws.on('close', () => {
    console.log(`[WebSocket] Client disconnected: ${ws.id} (${ws.username || 'Anonymous'})`);
    if (ws.username) {
      broadcast({
        type: 'SYSTEM',
        text: `${ws.username} left the chat`,
        timestamp: new Date().toISOString()
      });
      broadcastUserList();
    }
  });

  ws.on('error', (err) => {
    console.error(`[WebSocket] Client error on ${ws.id}:`, err.message);
  });
});

// Heartbeat interval to prune dead connections
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log(`[WebSocket] Terminating inactive connection: ${ws.id}`);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Closing WebSocket server and HTTP server...');
  clearInterval(heartbeatInterval);
  wss.close(() => {
    server.close(() => {
      console.log('[Server] Clean exit.');
      process.exit(0);
    });
  });
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(` 💬 Node.js WebSocket Chat Server Running!`);
  console.log(` Local URL : http://localhost:${PORT}`);
  console.log(` Port      : ${PORT}`);
  console.log(` Health    : http://localhost:${PORT}/health`);
  console.log(`====================================================`);
});

