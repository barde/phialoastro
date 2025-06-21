declare module '@cloudflare/kv-asset-handler' {
  export function getAssetFromKV(
    event: { request: Request; waitUntil: (promise: Promise<any>) => void },
    options?: any
  ): Promise<Response>;
  
  export function mapRequestToAsset(request: Request): Request;
}

declare module '__STATIC_CONTENT_MANIFEST' {
  const manifest: string;
  export default manifest;
}