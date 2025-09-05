import * as jwt from "jsonwebtoken";
import {
  HyperExpressRequest,
  HyperExpressResponse,
  HyperExpressNext,
} from "../types";

export interface JWTPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

export const authenticateToken = (
  req: HyperExpressRequest,
  res: HyperExpressResponse,
  next: HyperExpressNext
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Token de acesso é obrigatório" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET não configurado");
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Adicionar informações do usuário ao request
    (req as any).user = {
      id: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token expirado" });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Token inválido" });
    }

    console.error("Erro na autenticação:", error);
    return res.status(401).json({ error: "Token inválido" });
  }
};

export const generateToken = (userId: string, username: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado");
  }

  return jwt.sign({ userId, username }, secret, { expiresIn: "24h" });
};
