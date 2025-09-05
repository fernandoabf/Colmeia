// Tipos para Hyper-Express
export interface HyperExpressRequest {
  method: string;
  url: string;
  path: string;
  query: string;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  ip: string;
  proxy_ip: string;
  path_parameters: Record<string, string>;
  query_parameters: Record<string, string>;
  json(): Promise<any>;
  text(): Promise<string>;
  user?: AuthenticatedUser;
}

export interface HyperExpressResponse {
  status(code: number): HyperExpressResponse;
  header(name: string, value: string): void;
  json(data: any): void;
  send(data: string): void;
  end(data?: string): void;
  method: string;
}

export interface HyperExpressNext {
  (): void;
}

// Tipos de autenticação
export interface AuthenticatedUser {
  id: string;
  username: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

// Tipos de dados
export interface User {
  id: string;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Computer {
  id: string;
  name: string;
  ip: string;
  editKey: string;
  viewKey: string;
  vncAdminKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tailscale {
  id: string;
  tailscaleKey: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  username: string;
  password: string;
}

export interface CreateComputerRequest {
  name: string;
  ip: string;
  editKey: string;
  viewKey: string;
  vncAdminKey: string;
}

export interface UpdateComputerRequest {
  name?: string;
  ip?: string;
  editKey?: string;
  viewKey?: string;
  vncAdminKey?: string;
}

export interface CreateTailscaleRequest {
  tailscaleKey: string;
}
