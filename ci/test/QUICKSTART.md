# Playwright Test Image - Quick Start Guide

## 🚀 Getting Started in 2 Minutes

### Prerequisites
- Docker installed and running
- Base CI image built (run `make build` first)

### Build and Run Tests

```bash
# 1. Build the test image
make build-test

# 2. Run all E2E tests
make e2e

# 3. Open interactive shell (optional)
make e2e-shell
```

That's it! The tests should now be running in the container.

## 🧪 Common Testing Scenarios

### Run Specific Tests

```bash
# Run a single test file
./scripts/run-e2e.sh tests/e2e/homepage.spec.ts

# Run tests by tag
./scripts/run-e2e.sh -t @critical        # Critical tests only
./scripts/run-e2e.sh -t @smoke           # Smoke tests
./scripts/run-e2e.sh -t "@visual"        # Visual tests
```

### Debug Failed Tests

```bash
# Debug mode with browser UI
./scripts/run-e2e.sh -d tests/e2e/navigation.spec.ts

# Interactive shell to investigate
make e2e-shell
# Then inside container:
pnpm test:e2e --ui
```

### Update Visual Snapshots

```bash
./scripts/run-e2e.sh -u
```

## 📊 View Test Results

After tests run, reports are available at:
- `phialo-design/test-results/` - Raw test output
- `phialo-design/playwright-report/` - HTML report

View HTML report:
```bash
cd ../phialo-design
npx playwright show-report
```

## 🔧 Configuration Options

### Environment Variables
```bash
# Run with custom base URL
docker run -e BASE_URL=https://staging.phialo.de -v $(pwd):/app phialo-test:latest

# Run with specific number of workers
./scripts/run-e2e.sh -w 8

# Filter by test tag
docker run -e TEST_TAG=@critical -v $(pwd):/app phialo-test:latest
```

### Using Different Configs
```bash
# PR configuration (fast, critical only)
./scripts/run-e2e.sh -c playwright.pr.config.ts

# Smoke tests
./scripts/run-e2e.sh -c playwright.smoke.config.ts

# Nightly full suite
./scripts/run-e2e.sh -c playwright.config.ts -w 8
```

## 🐛 Troubleshooting

### Tests Failing to Start?
```bash
# Verify Playwright installation
docker run --rm phialo-test:latest pnpm exec playwright --version

# Check browser installations
docker run --rm phialo-test:latest pnpm exec playwright show-browsers
```

### Out of Memory?
```bash
# Run with more memory
docker run -m 4g -v $(pwd):/app phialo-test:latest
```

### Permission Issues?
```bash
# Fix ownership (run from phialo-design directory)
sudo chown -R $(id -u):$(id -g) test-results playwright-report
```

## 💡 Pro Tips

1. **Speed up tests**: Use fewer workers in resource-constrained environments
   ```bash
   ./scripts/run-e2e.sh -w 2
   ```

2. **Focus on failures**: Run only failed tests from last run
   ```bash
   pnpm test:e2e --last-failed
   ```

3. **Generate videos**: Helpful for debugging
   ```bash
   docker run -e VIDEO=on -v $(pwd):/app phialo-test:latest
   ```

4. **Clean artifacts**: Before fresh test run
   ```bash
   rm -rf test-results playwright-report
   ```

## 📚 More Information

- [Full Documentation](../docs/TEST_IMAGE.md)
- [Playwright Docs](https://playwright.dev)
- [Test Annotations Guide](../../phialo-design/tests/e2e/README.md)

## 🆘 Need Help?

1. Check container logs: `docker logs phialo-e2e-runner`
2. Run verification: `./scripts/test-playwright.sh`
3. Interactive debug: `make e2e-shell`
4. Check [troubleshooting guide](../docs/TEST_IMAGE.md#troubleshooting)