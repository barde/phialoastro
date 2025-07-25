// Cloudflare Turnstile type definitions
export interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  tabindex?: number;
  action?: string;
  cData?: string;
  'refresh-expired'?: 'auto' | 'manual' | 'never';
  'refresh-timeout'?: 'auto' | 'manual' | 'never';
  retry?: 'auto' | 'never';
  'retry-interval'?: number;
  size?: 'normal' | 'flexible' | 'compact';
  appearance?: 'always' | 'execute' | 'interaction-only';
  'response-field'?: boolean;
  'response-field-name'?: string;
}

export interface TurnstileInstance {
  render: (element: HTMLElement | string, options: TurnstileOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
  getResponse: (widgetId: string) => string | null;
  execute: (container: HTMLElement | string, options?: TurnstileOptions) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
    onloadTurnstileCallback?: () => void;
  }
}