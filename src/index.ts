import HyperExpress from "hyper-express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import {
  HyperExpressRequest,
  HyperExpressResponse,
  HyperExpressNext,
} from "./types";
import { authenticateToken, generateToken } from "./middleware/auth";
import { VncProxy } from "./vnc-proxy";

// Inicializar Prisma
const prisma = new PrismaClient();

// Inicializar HyperExpress
const app = new HyperExpress.Server();

// Inicializar VNC Proxy
const vncProxy = new VncProxy({ port: 8080 });

// Middleware para CORS
app.use(
  (
    req: HyperExpressRequest,
    res: HyperExpressResponse,
    next: HyperExpressNext
  ) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    next();
  }
);

// Rota de login (não requer autenticação)
app.post(
  "/api/auth/login",
  async (req: HyperExpressRequest, res: HyperExpressResponse) => {
    try {
      const body = await req.json();
      const { username, password } = body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username e password são obrigatórios" });
      }

      // Buscar usuário no banco
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      // Gerar token JWT
      const token = generateToken(user.id, user.username);

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// Rota de registro (não requer autenticação)
app.post(
  "/api/auth/register",
  async (req: HyperExpressRequest, res: HyperExpressResponse) => {
    try {
      const body = await req.json();
      const { username, password } = body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username e password são obrigatórios" });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Senha deve ter pelo menos 6 caracteres" });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
        },
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Gerar token JWT automaticamente após registro
      const token = generateToken(user.id, user.username);

      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        return res.status(400).json({ error: "Username já existe" });
      }
      console.error("Erro ao criar usuário:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// Rota de health check (não requer autenticação)
app.get(
  "/api/health",
  (req: HyperExpressRequest, res: HyperExpressResponse) => {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      vncProxy: {
        status: "running",
        port: 8080,
        path: "/ws/vnc",
      },
    });
  }
);

// Middleware de autenticação para todas as rotas protegidas
app.use("/api/users", authenticateToken);
app.use("/api/computers", authenticateToken);
app.use("/api/tailscale", authenticateToken);

// Rotas de usuários (protegidas)
app.get(
  "/api/users",
  async (req: HyperExpressRequest, res: HyperExpressResponse) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      res.json(users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

app.post(
  "/api/users",
  async (req: HyperExpressRequest, res: HyperExpressResponse) => {
    try {
      const body = await req.json();
      const { username, password } = body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username e password são obrigatórios" });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Senha deve ter pelo menos 6 caracteres" });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
        },
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.status(201).json(user);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        return res.status(400).json({ error: "Username já existe" });
      }
      console.error("Erro ao criar usuário:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// Rotas de computadores (protegidas)
app.get(
  "/api/computers",
  async (req: HyperExpressRequest, res: HyperExpressResponse) => {
    try {
      const computers = await prisma.computer.findMany();
      res.json(computers);
    } catch (error) {
      console.error("Erro ao buscar computadores:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

app.post(
  "/api/computers",
  async (req: HyperExpressRequest, res: HyperExpressResponse) => {
    try {
      const body = await req.json();
      const { name, ip, editKey, viewKey, vncAdminKey } = body;

      if (!name || !ip || !editKey || !viewKey || !vncAdminKey) {
        return res.status(400).json({
          error: "Todos os campos são obrigatórios",
        });
      }

      const computer = await prisma.computer.create({
        data: {
          name,
          ip,
          editKey,
          viewKey,
          vncAdminKey,
        },
      });

      res.status(201).json(computer);
    } catch (error) {
      console.error("Erro ao criar computador:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

app.patch(
  "/api/computers/:id",
  async (req: HyperExpressRequest, res: HyperExpressResponse) => {
    try {
      const { id } = req.path_parameters;

      if (!id) {
        return res.status(400).json({ error: "ID é obrigatório" });
      }

      const body = await req.json();

      const computer = await prisma.computer.update({
        where: { id },
        data: body,
      });

      res.json(computer);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Record to update not found")
      ) {
        return res.status(404).json({ error: "Computador não encontrado" });
      }
      console.error("Erro ao atualizar computador:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// Rotas de Tailscale (protegidas)
app.get(
  "/api/tailscale",
  async (req: HyperExpressRequest, res: HyperExpressResponse) => {
    try {
      const tailscale = await prisma.tailscale.findFirst({
        where: { status: "ACTIVE" },
      });

      if (!tailscale) {
        return res
          .status(404)
          .json({ error: "Nenhuma chave Tailscale ativa encontrada" });
      }

      res.json({ tailscaleKey: tailscale.tailscaleKey });
    } catch (error) {
      console.error("Erro ao buscar chave Tailscale:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

app.post(
  "/api/tailscale",
  async (req: HyperExpressRequest, res: HyperExpressResponse) => {
    try {
      const body = await req.json();
      const { tailscaleKey } = body;

      if (!tailscaleKey) {
        return res.status(400).json({ error: "Chave Tailscale é obrigatória" });
      }

      // Desativar todas as chaves existentes
      await prisma.tailscale.updateMany({
        where: { status: "ACTIVE" },
        data: { status: "INACTIVE" },
      });

      // Criar nova chave ativa
      const tailscale = await prisma.tailscale.create({
        data: {
          tailscaleKey,
          status: "ACTIVE",
        },
      });

      res.status(201).json(tailscale);
    } catch (error) {
      console.error("Erro ao salvar chave Tailscale:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// Rota para obter perfil do usuário autenticado
app.get(
  "/api/auth/profile",
  async (req: HyperExpressRequest, res: HyperExpressResponse) => {
    // Aplicar autenticação manualmente
    const authResult = await new Promise<boolean>((resolve) => {
      authenticateToken(req, res, () => resolve(true));
    });

    if (!authResult) return; // authenticateToken já respondeu com erro

    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json(user);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// Middleware de tratamento de erros
app.set_error_handler(
  (req: HyperExpressRequest, res: HyperExpressResponse, error: Error) => {
    console.error("Erro capturado pelo handler global:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
);

// Middleware para rotas não encontradas
app.set_not_found_handler(
  (req: HyperExpressRequest, res: HyperExpressResponse) => {
    res.status(404).json({ error: "Rota não encontrada" });
  }
);

// Inicializar servidor
const PORT = parseInt(process.env.PORT || "3000");

async function startServer() {
  try {
    // Testar conexão com o banco
    await prisma.$connect();
    console.log("✅ Conectado ao banco de dados PostgreSQL");

    // Iniciar servidor
    await app.listen(PORT);
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Login: http://localhost:${PORT}/api/auth/login`);
    console.log(`👤 Registro: http://localhost:${PORT}/api/auth/register`);
    console.log(`👥 Usuários: http://localhost:${PORT}/api/users`);
    console.log(`💻 Computadores: http://localhost:${PORT}/api/computers`);
    console.log(`🔑 Tailscale: http://localhost:${PORT}/api/tailscale`);
    console.log(`👤 Perfil: http://localhost:${PORT}/api/auth/profile`);
    console.log(`🔌 VNC Proxy: ws://localhost:8080/ws/vnc`);
  } catch (error) {
    console.error("❌ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Encerrando servidor...");
  vncProxy.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Encerrando servidor...");
  vncProxy.close();
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
