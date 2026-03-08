declare module 'ws' {
  export class WebSocket {
    static OPEN: number;
    readyState: number;
    send(data: any): void;
    on(event: string, listener: (...args: any[]) => void): this;
  }
  
  export class WebSocketServer {
    constructor(options: any);
    on(event: string, listener: (...args: any[]) => void): this;
  }
}
