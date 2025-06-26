# Cloudflare Workers Source Code Structure

This directory contains the refactored Cloudflare Workers code with improved organization and separation of concerns.

## Directory Structure

```
src/
├── config/              # Configuration and constants
│   └── index.ts        # Main configuration file (MIME types, cache settings, CSP, etc.)
├── handlers/           # Request handlers
│   ├── assets.ts       # KV asset handling logic
│   ├── headers.ts      # [Deprecated] Use security.ts
│   ├── redirects.ts    # [Deprecated] Use router/handlers/redirect.ts
│   ├── security.ts     # Security headers application
│   └── static.ts       # [Deprecated] Use assets.ts
├── middleware/         # Middleware functions
│   ├── cache.ts       # Edge caching middleware
│   ├── cors.ts        # CORS handling middleware
│   └── timing.ts      # Request timing and metrics
├── router/            # Routing logic
│   ├── index.ts       # Main router configuration
│   └── handlers/      # Route-specific handlers
│       ├── redirect.ts # Redirect handling
│       └── static.ts   # Static asset routing
├── types/             # TypeScript type definitions
│   ├── index.d.ts     # Module declarations
│   └── worker.ts      # Worker-specific types and interfaces
├── utils/             # Utility functions
│   ├── cache.ts       # [Deprecated] Use middleware/cache.ts
│   ├── errors.ts      # Error handling utilities
│   ├── logger.ts      # Structured logging
│   └── mime.ts        # MIME type utilities
├── index-simple.ts    # Simple worker example
└── index.ts           # Main worker entry point
```

## Architecture Overview

### 1. **Type Safety** (`types/worker.ts`)
- `WorkerEnv`: Environment variables and bindings
- `WorkerContext`: Request context with env and execution context
- `WorkerError`: Custom error class with error types
- `RouteHandler` and `Middleware`: Function type definitions

### 2. **Configuration** (`config/index.ts`)
- Security headers configuration
- Content Security Policy directives
- Cache configuration by file type
- MIME type mappings
- Environment-specific settings

### 3. **Request Flow**
1. Request enters through `index.ts`
2. Router applies global middleware (validation, CORS, timing)
3. Redirects are handled first
4. Static assets are served with caching
5. Security headers are applied to all responses
6. Errors are handled gracefully with proper logging

### 4. **Middleware Chain**
- **CORS**: Handles cross-origin requests
- **Timing**: Tracks request duration and logs metrics
- **Cache**: Provides edge caching for static assets
- **Validation**: Ensures request safety

### 5. **Error Handling**
- Custom `WorkerError` class for typed errors
- HTML and JSON error responses based on Accept header
- Comprehensive error logging
- Graceful fallbacks for 404 pages

### 6. **Logging**
- Structured logging with log levels
- Request/response logging
- Environment-aware log levels
- Child loggers for component isolation

## Key Features

### Asset Handling
- Automatic index.html resolution for directories
- Proper MIME type detection
- Cache headers based on file type
- 404 page handling with fallback

### Security
- Comprehensive security headers
- Content Security Policy with YouTube embedding support
- HSTS for HTTPS connections
- Request validation

### Performance
- Edge caching with cache status headers
- Request timing metrics
- Compression support detection
- Binary vs text file detection

### Developer Experience
- TypeScript with strict typing
- Modular architecture
- Comprehensive error messages
- Environment-specific configuration

## Migration Notes

### Deprecated Files
The following files are kept for backward compatibility but should not be used:
- `handlers/static.ts` → Use `handlers/assets.ts`
- `handlers/headers.ts` → Use `handlers/security.ts`
- `handlers/redirects.ts` → Use `router/handlers/redirect.ts`
- `utils/cache.ts` → Use `middleware/cache.ts`

### Breaking Changes
1. The main handler now expects `WorkerEnv` instead of `Env`
2. All handlers use `WorkerContext` instead of separate parameters
3. Error handling is centralized through `WorkerError` class
4. Logging is now structured with the logger utility

## Usage Examples

### Adding a New Route
```typescript
// In router/index.ts
router.get('/api/health', async (request: ContextRequest) => {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Adding a New Redirect
```typescript
// In router/handlers/redirect.ts
const redirectRules: RedirectRule[] = [
  { from: '/old-path', to: '/new-path', status: 301 },
  // ... other rules
];
```

### Custom Error Handling
```typescript
// Throw a typed error
throw new WorkerError(
  ErrorType.NOT_FOUND,
  404,
  'Resource not found',
  { resourceId: 'abc123' }
);
```

### Environment-Specific Logging
```typescript
// The logger automatically adjusts based on environment
logger.debug('This only shows in development');
logger.info('This shows in all environments');
logger.error('This always shows with stack traces');
```

## Testing

Run the test suite:
```bash
npm test
```

## Deployment

Deploy to different environments:
```bash
npm run deploy:preview    # Deploy to preview
npm run deploy:production # Deploy to production
```