// Tipurile legăturilor din runtime-ul Workers pe care le folosește Worker-ul (§3.5), fără pachetul @cloudflare/workers-types.

declare module 'cloudflare:email' {
  export class EmailMessage {
    constructor(from: string, to: string, raw: ReadableStream | string);
    readonly from: string;
    readonly to: string;
  }
}

/** Legătura `send_email` din wrangler.jsonc. */
interface SendEmail {
  send(message: import('cloudflare:email').EmailMessage): Promise<void>;
}

/** Legătura `ratelimits` din wrangler.jsonc. */
interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}
