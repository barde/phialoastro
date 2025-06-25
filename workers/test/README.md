# Cloudflare Workers Test Suite

This directory contains comprehensive tests for the Phialo Design Cloudflare Workers.

## Test Structure

- **`cache.test.ts`** - Tests for caching utility and cache headers
- **`e2e.test.ts`** - End-to-end tests using Miniflare
- **`headers.test.ts`** - Tests for security and cache header application
- **`index.test.ts`** - Integration tests for the main worker
- **`mime.test.ts`** - Tests for MIME type detection
- **`redirects.test.ts`** - Tests for URL redirect logic
- **`security.test.ts`** - Comprehensive security header tests
- **`static-handler.test.ts`** - Tests for static asset serving
- **`setup.ts`** - Test environment setup and global mocks
- **`mocks/`** - Mock data for testing

## Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Coverage Goals

The test suite aims for:
- **Lines**: 80%+
- **Functions**: 80%+
- **Branches**: 75%+
- **Statements**: 80%+

## Test Categories

### 1. Routing Logic
- Trailing slash removal
- Language-specific routing (German at root, English at /en/)
- Query parameter preservation
- Special character handling

### 2. Asset Serving
- Correct MIME type detection
- Path resolution (index.html for directories)
- 404 error handling with custom page fallback

### 3. Caching Behavior
- Cache-Control headers by file type
- Cache status headers (HIT/MISS)
- No caching for error responses

### 4. Security Headers
- Content Security Policy (CSP)
- X-Frame-Options, X-Content-Type-Options
- Referrer-Policy, Permissions-Policy
- Header application to all responses

### 5. Error Handling
- 404 responses with custom page
- 500 error fallback
- Malformed URL handling
- Invalid request method handling

## Writing New Tests

When adding new tests:

1. Use descriptive test names
2. Group related tests with `describe` blocks
3. Test both success and failure cases
4. Mock external dependencies appropriately
5. Verify security headers are applied

Example test structure:

```typescript
describe('Feature Name', () => {
  describe('Specific Functionality', () => {
    it('should handle normal case', () => {
      // Test implementation
    });

    it('should handle edge case', () => {
      // Test implementation
    });

    it('should handle error case', () => {
      // Test implementation
    });
  });
});
```

## Miniflare Testing

The E2E tests use Miniflare to simulate the Cloudflare Workers runtime:

- Provides realistic Worker environment
- Supports KV namespaces and other bindings
- Allows testing of complete request/response flow

## Debugging Tests

To debug failing tests:

1. Run specific test file: `npm test -- headers.test.ts`
2. Run specific test: `npm test -- -t "should apply security headers"`
3. Add console.log statements (mocked in setup.ts)
4. Check coverage report: `npm run test:coverage`

## Known Limitations

- Static asset tests require mocked KV responses
- Some Cloudflare-specific APIs may need mocking
- Cache API behavior differs from production