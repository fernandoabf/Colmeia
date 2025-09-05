declare module "novnc-core" {
  export class RFB {
    constructor(target: HTMLElement, url: string, options?: any);
    addEventListener(event: string, callback: (e: any) => void): void;
    removeEventListener(event: string, callback: (e: any) => void): void;
    disconnect(): void;
    sendCredentials(credentials: any): void;
  }

  export default RFB;
}

declare module "@novnc/novnc/lib/rfb.js" {
  export class RFB {
    constructor(target: HTMLElement, url: string, options?: any);
    addEventListener(event: string, callback: (e: any) => void): void;
    removeEventListener(event: string, callback: (e: any) => void): void;
    disconnect(): void;
    sendCredentials(credentials: any): void;
  }

  export default RFB;
}

declare module "@novnc/novnc" {
  export class RFB {
    constructor(target: HTMLElement, url: string, options?: any);
    addEventListener(event: string, callback: (e: any) => void): void;
    removeEventListener(event: string, callback: (e: any) => void): void;
    disconnect(): void;
    sendCredentials(credentials: any): void;
  }

  export default {
    RFB: RFB,
  };
}
