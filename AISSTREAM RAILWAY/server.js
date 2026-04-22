/**
 * ============================================================
 * PROJETO: Google Maps + WebSocket Prototype
 * ARQUIVO: server.js
 * ANO: 2026
 * DATA: 2026-04-22
 * HORA: 22:30 BRT
 * VERSÃO: v1.1.0
 * AUTOR: Jossian Brito
 * ============================================================
 *
 * MODIFICAÇÕES IMPLEMENTADAS:
 * - Ajuste para uso em ambiente Railway
 * - Leitura da porta via variável de ambiente
 * - Melhoria de log de inicialização
 * - Preparação para produção
 * ============================================================
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  let filePath = "./public/index.html";

  if (req.url !== "/") {
    filePath = "." + req.url;
  }

  const extname = path.extname(filePath).toLowerCase();

  const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
  };

  const contentType = mimeTypes[extname] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Arquivo não encontrado.");
      } else {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(`Erro interno: ${error.code}`);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

const wss = new WebSocket.Server({ server });

const vessels = [
  {
    id: "TUG-001",
    name: "Tug Alpha",
    lat: -8.3942,
    lng: -34.9608,
    heading: 90,
    speed: 9.8,
  },
];

function broadcastFleet() {
  const payload = JSON.stringify({
    type: "fleet_update",
    timestamp: new Date().toISOString(),
    vessels,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on("connection", (ws, req) => {
  console.log("Cliente conectado via WebSocket.");

  ws.send(
    JSON.stringify({
      type: "fleet_update",
      timestamp: new Date().toISOString(),
      vessels,
    })
  );

  ws.on("close", () => {
    console.log("Cliente desconectado.");
  });

  ws.on("error", (error) => {
    console.error("Erro no WebSocket:", error.message);
  });
});

setInterval(() => {
  vessels[0].lat += (Math.random() - 0.5) * 0.001;
  vessels[0].lng += (Math.random() - 0.5) * 0.001;
  vessels[0].heading = (vessels[0].heading + 5) % 360;
  broadcastFleet();
}, 2000);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});