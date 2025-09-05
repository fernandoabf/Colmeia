# 🐝 Colmeia Backend

Backend Node.js com Hyper-Express e Prisma para gerenciamento de usuários, computadores e chaves Tailscale.

## 🚀 Tecnologias

- **Node.js** com **TypeScript**
- **Hyper-Express** para o servidor web de alta performance
- **Prisma** como ORM
- **PostgreSQL** como banco de dados
- **Docker Compose** para infraestrutura
- **bcryptjs** para hash de senhas
- **JWT** para autenticação e autorização

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 18+ instalado
- npm ou yarn instalado

## 🛠️ Instalação e Configuração

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd colmeia
```

### 2. Configure as variáveis de ambiente

```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/colmeia?schema=public"
PORT=3000
JWT_SECRET="sua_chave_secreta_aqui"
```

**⚠️ IMPORTANTE:** Altere o `JWT_SECRET` para uma chave segura e única em produção!

### 3. Suba os containers do banco de dados

```bash
docker compose up -d
```

### 4. Instale as dependências

```bash
npm install
```

### 5. Gere o cliente Prisma

```bash
npm run prisma:generate
```

### 6. Execute as migrações do banco

```bash
npm run prisma:migrate
```

### 7. (Opcional) Execute o seed para dados iniciais

```bash
npm run prisma:seed
```

### 8. Inicie o servidor

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm run build
npm start
```

## 🔐 Sistema de Autenticação

O projeto utiliza **JWT (JSON Web Tokens)** para autenticação:

- **Token de acesso**: Expira em 24 horas
- **Hash de senhas**: bcrypt com salt rounds 10
- **Rotas públicas**: `/api/health`, `/api/auth/login`, `/api/auth/register`
- **Rotas protegidas**: Todas as outras rotas requerem token válido

### Fluxo de Autenticação

1. **Registro**: `POST /api/auth/register` - Cria conta e retorna token
2. **Login**: `POST /api/auth/login` - Autentica e retorna token
3. **Uso**: Incluir `Authorization: Bearer {token}` em todas as requisições protegidas

## 🗄️ Estrutura do Banco de Dados

### Modelos Prisma

#### User

- `id`: UUID único
- `username`: Nome de usuário único
- `password`: Senha hash com bcrypt
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização

#### Computer

- `id`: UUID único
- `name`: Nome do computador
- `ip`: Endereço IP
- `editKey`: Chave de edição
- `viewKey`: Chave de visualização
- `vncAdminKey`: Chave de administração VNC
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização

#### Tailscale

- `id`: UUID único
- `tailscaleKey`: Chave Tailscale única
- `status`: Status da chave (ACTIVE/INACTIVE)
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização

## 📡 API Endpoints

### 🔓 Rotas Públicas (não requerem autenticação)

#### Health Check

- `GET /api/health` - Status do servidor

#### Autenticação

- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de usuário

### 🔒 Rotas Protegidas (requerem autenticação JWT)

#### Usuários

- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário

#### Computadores

- `GET /api/computers` - Listar computadores
- `POST /api/computers` - Criar computador
- `PATCH /api/computers/:id` - Atualizar computador

#### Tailscale

- `GET /api/tailscale` - Obter chave ativa
- `POST /api/tailscale` - Salvar nova chave

#### Perfil

- `GET /api/auth/profile` - Obter perfil do usuário autenticado

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia servidor em modo desenvolvimento
- `npm run build` - Compila TypeScript para JavaScript
- `npm start` - Inicia servidor em produção
- `npm run prisma:generate` - Gera cliente Prisma
- `npm run prisma:migrate` - Executa migrações
- `npm run prisma:studio` - Abre Prisma Studio
- `npm run prisma:seed` - Executa seed do banco

## 🐳 Docker

### Serviços

- **db**: PostgreSQL 15 na porta 5432

### Comandos úteis

```bash
# Subir containers
docker compose up -d

# Parar containers
docker compose down

# Ver logs
docker compose logs -f

# Acessar banco
docker compose exec db psql -U postgres -d colmeia
```

## 🔐 Segurança

- **Senhas**: Hash com bcrypt (salt rounds: 10)
- **JWT**: Tokens assinados com chave secreta configurável
- **CORS**: Configurado para permitir todas as origens (configurar adequadamente para produção)
- **Validação**: Entrada validada em todos os endpoints
- **Tratamento de erros**: Mensagens apropriadas sem exposição de dados sensíveis
- **Hyper-Express**: Alta performance e segurança

## 📝 Exemplos de Uso

### 1. Registro de usuário

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "senha123"}'
```

### 2. Login e obtenção do token

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "senha123"}' | \
  jq -r '.token')

echo "Token: $TOKEN"
```

### 3. Criar computador (com autenticação)

```bash
curl -X POST http://localhost:3000/api/computers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "PC-01",
    "ip": "192.168.1.100",
    "editKey": "edit123",
    "viewKey": "view123",
    "vncAdminKey": "vnc123"
  }'
```

### 4. Salvar chave Tailscale (com autenticação)

```bash
curl -X POST http://localhost:3000/api/tailscale \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tailscaleKey": "tskey-auth-abc123def456ghi789"}'
```

## 🚨 Troubleshooting

### Erro de conexão com banco

- Verifique se os containers estão rodando: `docker compose ps`
- Verifique as credenciais no arquivo `.env`
- Aguarde alguns segundos após subir os containers

### Erro de migração

- Certifique-se de que o banco está acessível
- Verifique se o schema está correto em `prisma/schema.prisma`

### Erro de compilação TypeScript

- Verifique se todas as dependências estão instaladas
- Execute `npm run build` para ver erros detalhados

### Erro com Hyper-Express

- Verifique se a versão 2.0.2 está instalada
- Hyper-Express usa uWebSockets.js internamente para alta performance

### Erro de autenticação JWT

- Verifique se o `JWT_SECRET` está configurado no `.env`
- Certifique-se de incluir o header `Authorization: Bearer {token}`
- Tokens expiram em 24 horas - faça novo login se necessário

## 📚 Recursos Adicionais

- [Documentação do Hyper-Express](https://github.com/kartikk221/hyper-express)
- [Documentação do Prisma](https://www.prisma.io/docs/)
- [Documentação do TypeScript](https://www.typescriptlang.org/docs/)
- [Docker Compose](https://docs.docker.com/compose/)
- [JWT.io](https://jwt.io/) - Informações sobre JWT

## 🚀 Performance

Hyper-Express é construído sobre uWebSockets.js, oferecendo:

- Alta performance para requisições HTTP
- Suporte nativo a WebSockets
- Baixo uso de memória
- Processamento assíncrono por natureza

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
