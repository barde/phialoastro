# Enhanced Cloudflare Turnstile Pre-clearance Setup Guide

This guide explains how to set up and configure the enhanced Cloudflare Turnstile pre-clearance system with comprehensive security, performance, and accessibility improvements.

## Overview

The enhanced Turnstile implementation builds upon the original pre-clearance system with:
- Token rotation and usage limits
- Cross-domain protection
- WCAG 2.1 AA accessibility compliance
- Performance optimizations with preloading
- Analytics and monitoring
- Backward compatibility

## Prerequisites

1. A Cloudflare account
2. A Turnstile site created in the Cloudflare dashboard
3. Your site key and secret key

## Basic Setup

### 1. Environment Configuration

Create or update your `.env` file:

```bash
# Required
PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key

# Optional - Enhanced Security
TURNSTILE_ALLOWED_HOSTNAMES=phialo.de,www.phialo.de
TURNSTILE_ALLOWED_ORIGINS=https://phialo.de,https://www.phialo.de

# Optional - Analytics (requires KV namespaces)
TURNSTILE_ANALYTICS=turnstile-analytics
CONTACT_ANALYTICS=contact-analytics
```

### 2. Turnstile Dashboard Configuration

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Turnstile
3. Add your domains:
   - Production: `phialo.de`, `www.phialo.de`
   - Preview: `*.workers.dev`
   - Development: `localhost:4321`, `localhost:4322`

### 3. Client-Side Implementation

The TurnstileProvider is already integrated with BaseLayout. No changes needed for basic usage.

#### Using Enhanced Features

```tsx
// In your component
import { useTurnstile } from '@/shared/contexts/TurnstileProvider';

export function MyForm() {
  const { getToken, isReady, error, preloadToken } = useTurnstile();
  
  // Preload token for better UX
  useEffect(() => {
    if (isReady) {
      preloadToken('my-form');
    }
  }, [isReady]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Token rotation is automatic based on security level
      const token = await getToken('my-form');
      
      // Submit with token
      const response = await fetch('/api/my-endpoint', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          turnstileToken: token,
        }),
      });
    } catch (error) {
      console.error('Failed to get token:', error);
    }
  };
}
```

### 4. Server-Side Validation

The enhanced validation includes cross-domain protection:

```typescript
// Automatic enhancement detection
const turnstileService = env.TURNSTILE_ALLOWED_HOSTNAMES || env.TURNSTILE_ALLOWED_ORIGINS
  ? TurnstileService.fromEnv(env)
  : new TurnstileService(env.TURNSTILE_SECRET_KEY);

// Validate with additional security
const result = await turnstileService.validate(
  token,
  request.headers.get('CF-Connecting-IP'),
  {
    origin: request.headers.get('Origin'),
    hostname: new URL(request.url).hostname,
  }
);
```

## Enhanced Features

### Security Levels

Configure different security levels per action:

```typescript
<TurnstileProvider
  securityLevels={{
    'contact-form': 'managed',      // 5 uses max
    'payment-form': 'interactive',  // 1 use only
    'newsletter': 'non-interactive', // 10 uses max
  }}
>
```

### Token Rotation

High-security actions always get fresh tokens:

- `interactive`: Single-use tokens, always fresh
- `managed`: 5 uses maximum, balanced approach
- `non-interactive`: 10 uses maximum, minimal friction

### Cross-Domain Protection

Validate requests against allowed domains:

```bash
# Environment variables
TURNSTILE_ALLOWED_HOSTNAMES=phialo.de,www.phialo.de
TURNSTILE_ALLOWED_ORIGINS=https://phialo.de,https://www.phialo.de
```

### Accessibility Features

The enhanced implementation includes:
- ARIA attributes for screen readers
- Focus management and restoration
- Keyboard navigation support (Escape to cancel)
- Proper dialog semantics

### Performance Optimizations

1. **Token Preloading**:
```typescript
const { preloadToken } = useTurnstile();
preloadToken('contact-form'); // Pre-warm cache
```

2. **Intelligent Caching**:
- LRU cache prevents memory bloat
- Automatic expiration after 5 minutes
- Usage tracking per token

### Analytics and Monitoring

Track Turnstile performance with KV storage:

```typescript
// Automatic tracking of:
// - Daily success counts
// - Failed validation attempts by IP
// - Average challenge completion time
// - Cache hit/miss ratios
```

## Development and Testing

### Test Keys

Use these keys for testing:

```bash
# Always passes
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# Always blocks
PUBLIC_TURNSTILE_SITE_KEY=2x00000000000000000000AB
TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA
```

### Debug Mode

Enable debug panel in development:

```tsx
<TurnstileProvider debugMode={true}>
  {children}
</TurnstileProvider>
```

Shows:
- Ready state
- Token cache status
- Analytics metrics
- Error information

## Troubleshooting

### Common Issues

1. **"Turnstile is not defined"**
   - Ensure the script is loaded in BaseLayout
   - Check CSP headers allow `challenges.cloudflare.com`

2. **"hostname-not-allowed"**
   - Add hostname to `TURNSTILE_ALLOWED_HOSTNAMES`
   - Check Turnstile dashboard configuration

3. **Token expiration**
   - Tokens expire after 5 minutes
   - High-security actions may have single-use tokens
   - The system automatically fetches new tokens

4. **Hydration errors**
   - The implementation handles SSR properly
   - Check that you're using the Context within TurnstileProvider

### CSP Configuration

Ensure your Content Security Policy includes:

```
script-src 'self' https://challenges.cloudflare.com;
frame-src https://challenges.cloudflare.com;
connect-src 'self';
```

## Migration from Basic Implementation

The enhanced implementation is fully backward compatible. To use new features:

1. Add optional environment variables
2. Update server-side validation to use `TurnstileService.fromEnv(env)`
3. Optionally configure security levels in TurnstileProvider
4. Enable analytics with KV namespaces

## Best Practices

1. **Security Levels**: Use `interactive` for payment/auth forms
2. **Preloading**: Preload tokens for critical user paths
3. **Error Handling**: Always handle token acquisition failures
4. **Analytics**: Monitor success rates and adjust security levels
5. **Testing**: Use test keys in development/staging

## Conclusion

The enhanced Turnstile implementation provides enterprise-grade security with excellent user experience. The system automatically handles token rotation, cross-domain validation, and performance optimization while maintaining full backward compatibility.