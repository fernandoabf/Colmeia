declare module "hyper-express" {
  export interface Request {
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
  }

  export interface Response {
    status(code: number): Response;
    header(name: string, value: string): void;
    json(data: any): void;
    send(data: string): void;
    end(data?: string): void;
    method: string;
  }

  export interface NextFunction {
    (): void;
  }

  export class Server {
    constructor(options?: {
      key_file_name?: string;
      cert_file_name?: string;
      passphrase?: string;
      dh_params_file_name?: string;
      ssl_prefer_low_memory_usage?: boolean;
    });

    // Overloads para middlewares
    use(
      handler: (req: Request, res: Response, next: NextFunction) => void
    ): void;
    use(
      pattern: string,
      handler: (req: Request, res: Response, next: NextFunction) => void
    ): void;

    get(pattern: string, handler: (req: Request, res: Response) => void): void;
    post(pattern: string, handler: (req: Request, res: Response) => void): void;
    patch(
      pattern: string,
      handler: (req: Request, res: Response) => void
    ): void;
    delete(
      pattern: string,
      handler: (req: Request, res: Response) => void
    ): void;
    put(pattern: string, handler: (req: Request, res: Response) => void): void;
    head(pattern: string, handler: (req: Request, res: Response) => void): void;
    options(
      pattern: string,
      handler: (req: Request, res: Response) => void
    ): void;
    trace(
      pattern: string,
      handler: (req: Request, res: Response) => void
    ): void;
    connect(
      pattern: string,
      handler: (req: Request, res: Response) => void
    ): void;
    any(pattern: string, handler: (req: Request, res: Response) => void): void;

    set_error_handler(
      handler: (req: Request, res: Response, error: Error) => void
    ): void;
    set_not_found_handler(handler: (req: Request, res: Response) => void): void;

    listen(port: number, host?: string): Promise<any>;
    close(socket?: any): void;
  }
}
