import { WebSocket, WebSocketServer } from "ws";
import { createConnection } from "net";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

interface VncProxyOptions {
  port?: number;
  allowedHosts?: string[];
  allowedPorts?: number[];
}

export class VncProxy {
  private wss: WebSocketServer;
  private allowedHosts: string[];
  private allowedPorts: number[];

  constructor(options: VncProxyOptions = {}) {
    this.allowedHosts = options.allowedHosts || [
      "100.64.0.0/10",
      "fd7a:115c:a1e0::/48",
    ]; // Tailscale ranges
    this.allowedPorts = options.allowedPorts || [
      5900, 5901, 5902, 5903, 5904, 5905,
    ]; // VNC ports

    this.wss = new WebSocketServer({
      port: options.port || 8080,
      path: "/ws/vnc",
    });

    this.wss.on("connection", this.handleConnection.bind(this));
    console.log(
      `🔌 VNC Proxy WebSocket rodando na porta ${options.port || 8080}`
    );
  }

  private async handleConnection(ws: WebSocket, request: any) {
    try {
      // Validar JWT
      const url = new URL(request.url, "http://localhost");
      const token = url.searchParams.get("auth");

      if (!token) {
        ws.close(1008, "Token de autenticação obrigatório");
        return;
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        ws.close(1011, "JWT_SECRET não configurado");
        return;
      }

      const decoded = jwt.verify(token, secret) as any;
      if (!decoded.userId) {
        ws.close(1008, "Token inválido");
        return;
      }

      // Validar parâmetros
      const ip = url.searchParams.get("ip");
      const type = url.searchParams.get("type") || "view";

      if (!ip) {
        ws.close(1008, "IP obrigatório");
        return;
      }

      // Validar IP (Tailscale ranges)
      if (!this.isAllowedHost(ip)) {
        ws.close(1008, "Host não permitido");
        return;
      }

      // Buscar computador no banco para validar credenciais
      const computer = await prisma.computer.findFirst({
        where: { ip },
      });

      if (!computer) {
        ws.close(1008, "Computador não encontrado");
        return;
      }

      // Determinar porta VNC baseada no tipo
      let vncPort = 5900;
      if (type === "edit" && computer.editKey) vncPort = 5901;
      else if (type === "admin" && computer.vncAdminKey) vncPort = 5902;
      else if (type === "view" && computer.viewKey) vncPort = 5900;

      // Conectar ao VNC via Tailscale
      const tcpSocket = createConnection(vncPort, ip, () => {
        console.log(`🔗 Conectado ao VNC ${ip}:${vncPort} (${type})`);
      });

      tcpSocket.on("error", (err) => {
        console.error(`❌ Erro TCP para ${ip}:${vncPort}:`, err.message);
        ws.close(1011, `Erro de conexão: ${err.message}`);
      });

      // Pipe bidirecional
      ws.on("message", (data) => {
        if (tcpSocket.writable) {
          tcpSocket.write(data);
        }
      });

      tcpSocket.on("data", (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      // Cleanup
      ws.on("close", () => {
        console.log(`🔌 WebSocket fechado para ${ip}:${vncPort}`);
        tcpSocket.destroy();
      });

      tcpSocket.on("close", () => {
        console.log(`🔌 TCP fechado para ${ip}:${vncPort}`);
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
    } catch (error) {
      console.error("❌ Erro na conexão VNC:", error);
      ws.close(1011, "Erro interno");
    }
  }

  private isAllowedHost(ip: string): boolean {
    // Validação simples de ranges Tailscale
    if (ip.startsWith("100.") || ip.startsWith("fd7a:")) {
      return true;
    }

    // Permitir localhost para desenvolvimento
    if (ip === "localhost" || ip === "127.0.0.1") {
      return true;
    }

    return false;
  }

  public close() {
    this.wss.close();
  }
}
