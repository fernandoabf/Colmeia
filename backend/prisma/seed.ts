import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
    },
  });

  console.log("✅ Usuário admin criado:", adminUser.username);

  // Criar computador de exemplo
  const computer = await prisma.computer.create({
    data: {
      name: "PC-Exemplo",
      ip: "192.168.1.100",
      editKey: "edit_exemplo_123",
      viewKey: "view_exemplo_123",
      vncAdminKey: "vnc_admin_123",
    },
  });

  console.log("✅ Computador de exemplo criado:", computer.name);

  // Criar chave Tailscale de exemplo
  const tailscale = await prisma.tailscale.upsert({
    where: { tailscaleKey: "tskey-exemplo-123" },
    update: {},
    create: {
      tailscaleKey: "tskey-exemplo-123",
      status: "ACTIVE",
    },
  });

  console.log("✅ Chave Tailscale de exemplo criada:", tailscale.tailscaleKey);

  console.log("🎉 Seed concluído com sucesso!");
  console.log("🔑 Credenciais de acesso:");
  console.log("   Username: admin");
  console.log("   Password: admin123");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
