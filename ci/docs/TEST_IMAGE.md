# Playwright Test Image Documentation

## Overview

The Playwright test image extends the base CI image with comprehensive E2E testing capabilities. It includes Playwright with all three browser engines (Chromium, Firefox, WebKit) and necessary dependencies for headless testing.

## Image Details

- **Base**: `phialo-ci-base:latest`
- **Size**: ~800MB (includes browsers)
- **Browsers**: Chromium, Firefox, WebKit
- **Display**: Xvfb for headless operation
- **Video**: FFmpeg for test recordings

## Features

### Browser Support
- **Chromium**: Latest stable version via Playwright
- **Firefox**: ESR version with full compatibility
- **WebKit**: GTK-based WebKit for Safari testing

### Testing Capabilities
- Parallel test execution (default: 4 workers)
- Video recording on failure
- Screenshot capture
- Network interception
- Mobile device emulation
- Accessibility testing (axe-core)

### Optimizations
- Pre-installed browsers in image
- Cached browser binaries
- Xvfb auto-start for headless mode
- Signal handling with dumb-init
- Non-root user execution

## Usage

### Quick Start

```bash
# Build the test image
make build-test

# Run all E2E tests
make e2e

# Open interactive shell
make e2e-shell
```

### Running Tests

#### All Tests
```bash
docker run --rm -v $(pwd):/app phialo-test:latest
```

#### Specific Test File
```bash
docker run --rm -v $(pwd):/app phialo-test:latest \
  pnpm test:e2e -- tests/e2e/homepage.spec.ts
```

#### With Test Tags
```bash
# Run only critical tests
docker run --rm -v $(pwd):/app -e TEST_TAG=@critical phialo-test:latest

# Run smoke tests
docker run --rm -v $(pwd):/app -e TEST_TAG=@smoke phialo-test:latest
```

#### Debug Mode
```bash
# Interactive debug with headed browser
./scripts/run-e2e.sh -d tests/e2e/navigation.spec.ts

# With browser UI (requires X11)
docker run -it --rm \
  -v $(pwd):/app \
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  phialo-test:latest \
  pnpm test:e2e --debug
```

### Using run-e2e.sh Script

The `run-e2e.sh` script provides a convenient interface:

```bash
# Run all tests
./scripts/run-e2e.sh

# Run with specific config
./scripts/run-e2e.sh -c playwright.pr.config.ts

# Run tests with tag
./scripts/run-e2e.sh -t @critical

# Debug specific test
./scripts/run-e2e.sh -d tests/e2e/homepage.spec.ts

# Update snapshots
./scripts/run-e2e.sh -u

# Interactive mode
./scripts/run-e2e.sh -i
```

### Docker Compose

```bash
# Run E2E tests via compose
docker-compose run --rm e2e

# Run critical tests only
docker-compose run --rm e2e-critical

# View logs
docker-compose logs e2e
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CI` | CI mode flag | `true` |
| `NODE_ENV` | Node environment | `test` |
| `TEST_TAG` | Filter tests by tag | - |
| `PLAYWRIGHT_BROWSERS_PATH` | Browser install path | `/ms-playwright` |
| `DISPLAY` | X11 display | `:99` |
| `BASE_URL` | Test base URL | `http://localhost:4322` |

## Test Configuration

### Playwright Configs

- `playwright.config.ts` - Default full test suite
- `playwright.pr.config.ts` - PR tests (critical only)
- `playwright.smoke.config.ts` - Smoke tests
- `playwright.browserstack.config.ts` - BrowserStack tests
- `playwright.ai.config.ts` - AI-assisted tests

### Test Annotations

```typescript
// Mark test as critical (runs in PR checks)
test('@critical homepage loads', async ({ page }) => {
  // test code
});

// Mark as smoke test
test('@smoke navigation works', async ({ page }) => {
  // test code
});

// Mark as visual regression test
test('@visual hero section', async ({ page }) => {
  // test code
});

// Mark as slow (excluded from PR runs)
test('@slow full site crawl', async ({ page }) => {
  // test code
});
```

## CI/CD Integration

### GitHub Actions

```yaml
jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    container:
      image: phialo-test:latest
    steps:
      - uses: actions/checkout@v4
      - name: Run E2E tests
        run: pnpm test:e2e:ci
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-results
          path: |
            test-results/
            playwright-report/
```

### GitLab CI

```yaml
e2e-tests:
  image: phialo-test:latest
  script:
    - pnpm test:e2e:ci
  artifacts:
    when: on_failure
    paths:
      - test-results/
      - playwright-report/
    expire_in: 1 week
```

## Troubleshooting

### Common Issues

#### Browser Launch Failures
```bash
# Check browser dependencies
docker run --rm phialo-test:latest pnpm exec playwright install-deps

# Verify display server
docker run --rm phialo-test:latest /bin/sh -c "Xvfb :99 & sleep 2 && echo $DISPLAY"
```

#### Permission Issues
```bash
# Ensure correct ownership
docker run --rm -v $(pwd):/app phialo-test:latest ls -la /app
```

#### Out of Memory
```bash
# Increase container memory
docker run --rm -m 4g phialo-test:latest
```

### Debug Commands

```bash
# Check installed browsers
docker run --rm phialo-test:latest pnpm exec playwright show-browsers

# Test browser launch
docker run --rm phialo-test:latest node -e "
  const { chromium } = require('playwright');
  chromium.launch().then(b => { console.log('OK'); b.close(); });
"

# View environment
docker run --rm phialo-test:latest env | grep -E "(PLAY|DISPLAY|NODE)"
```

## Maintenance

### Updating Browsers

```bash
# Rebuild with latest browsers
docker build --no-cache -f test/Dockerfile -t phialo-test:latest .

# Or update in running container
docker run -it phialo-test:latest /bin/sh
> pnpm exec playwright install --force
```

### Image Optimization

```bash
# Check image size
docker images phialo-test:latest

# Analyze layers
docker history phialo-test:latest

# Remove unused data
docker image prune -a
```

## Performance Tips

1. **Use Parallel Workers**: Default is 4, adjust based on CPU
2. **Enable Trace on Retry**: Helps debug flaky tests
3. **Disable Video**: Unless debugging failures
4. **Use Specific Configs**: PR config for faster CI
5. **Cache Test Results**: Mount volumes for artifacts

## Security Considerations

- Runs as non-root user (`node`)
- Minimal Alpine base reduces attack surface
- No SSH or unnecessary services
- Scoped npm token not included
- Browser sandboxing may be limited in container

## Next Steps

- Add visual regression testing setup
- Integrate with cloud testing services
- Add performance testing capabilities
- Create specialized configs for different environments
- Add test result reporting dashboards