import { vi } from 'vitest';

// Mock global objects that are available in Workers runtime
global.caches = {
  default: {
    match: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
} as any;

// Mock console for cleaner test output
global.console = {
  ...console,
  error: vi.fn(console.error),
  warn: vi.fn(console.warn),
  log: vi.fn(console.log),
};

// Mock Request/Response if needed
if (!global.Request) {
  global.Request = class Request {
    url: string;
    method: string;
    headers: Headers;
    body: any;

    constructor(input: string | Request, init?: RequestInit) {
      if (typeof input === 'string') {
        this.url = input;
      } else {
        this.url = input.url;
      }
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.body = init?.body;
    }

    clone() {
      return new Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
      });
    }

    text() {
      return Promise.resolve(this.body?.toString() || '');
    }

    json() {
      return Promise.resolve(JSON.parse(this.body?.toString() || '{}'));
    }
  } as any;
}

if (!global.Response) {
  global.Response = class Response {
    body: any;
    status: number;
    statusText: string;
    headers: Headers;

    constructor(body?: any, init?: ResponseInit) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Headers(init?.headers);
    }

    clone() {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      });
    }

    text() {
      return Promise.resolve(this.body?.toString() || '');
    }

    json() {
      return Promise.resolve(JSON.parse(this.body?.toString() || '{}'));
    }
  } as any;
}

if (!global.Headers) {
  global.Headers = class Headers {
    private headers: Map<string, string> = new Map();

    constructor(init?: HeadersInit) {
      if (init) {
        if (init instanceof Headers) {
          init.forEach((value, key) => {
            this.headers.set(key.toLowerCase(), value);
          });
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => {
            this.headers.set(key.toLowerCase(), value);
          });
        } else {
          Object.entries(init).forEach(([key, value]) => {
            this.headers.set(key.toLowerCase(), String(value));
          });
        }
      }
    }

    get(name: string) {
      return this.headers.get(name.toLowerCase()) || null;
    }

    set(name: string, value: string) {
      this.headers.set(name.toLowerCase(), value);
    }

    has(name: string) {
      return this.headers.has(name.toLowerCase());
    }

    delete(name: string) {
      this.headers.delete(name.toLowerCase());
    }

    forEach(callback: (value: string, key: string, parent: Headers) => void) {
      this.headers.forEach((value, key) => callback(value, key, this));
    }

    entries() {
      return this.headers.entries();
    }

    keys() {
      return this.headers.keys();
    }

    values() {
      return this.headers.values();
    }
  } as any;
}