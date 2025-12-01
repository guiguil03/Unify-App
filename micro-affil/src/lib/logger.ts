// Simple logger pour le développement

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  log(message: string, ...args: any[]): void {
    console.log(`[${this.context}] ${message}`, ...args);
  }

  error(message: string, trace?: string, ...args: any[]): void {
    console.error(`[${this.context}] ERROR: ${message}`, trace, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.context}] WARN: ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.context}] DEBUG: ${message}`, ...args);
    }
  }
}
