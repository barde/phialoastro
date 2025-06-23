# Nightly Comprehensive Test Suite

This document describes the nightly test suite that runs comprehensive tests on the Phialo Design website.

## Overview

The nightly test suite runs at 2 AM UTC every night and includes:

- **Full E2E test matrix**: All 80 test scenarios across 15 browser configurations
- **Performance testing**: Lighthouse scores for all pages in both languages
- **Unit tests**: Full test coverage across all Node.js versions and platforms
- **Security scanning**: npm audit and Snyk vulnerability scanning

## GitHub Actions Workflow

The workflow is defined in `.github/workflows/nightly-tests.yml` and can be:
- Triggered automatically at 2 AM UTC daily
- Manually triggered from the Actions tab with debug options
- Configured to create GitHub issues when tests fail

### Manual Trigger Options

When manually triggering the workflow, you can set:
- **Debug mode**: Extends timeouts and runs tests with single worker
- **Issue creation**: Toggle automatic GitHub issue creation for failures

## Test Configuration

### E2E Tests

The nightly E2E tests use an extended Playwright configuration (`playwright.nightly.config.ts`) that includes:

- 15 browser configurations (desktop, mobile, tablet, landscape modes)
- Extended timeouts (60s per test, 3 retries)
- Full trace, screenshot, and video capture
- Parallel execution with 4 workers in CI

### Performance Tests

Lighthouse tests run against all pages with these thresholds:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 90+

Additional metrics tracked:
- Cumulative Layout Shift: < 0.1
- First Contentful Paint: < 2s
- Largest Contentful Paint: < 3s
- Total Blocking Time: < 300ms
- Speed Index: < 4s

### Browser Matrix

The full browser matrix includes:

**Desktop Browsers:**
- Chrome, Firefox, Safari (standard viewports)
- Chrome, Firefox, Safari (1920x1080)
- Chrome HiDPI (2560x1440)
- Chrome with reduced motion
- Chrome in dark mode

**Mobile Browsers:**
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)
- Both in portrait and landscape modes

**Tablets:**
- iPad Pro (portrait and landscape)

## Running Tests Locally

Use the provided script to run nightly tests locally:

```bash
# Run all nightly tests
./scripts/run-nightly-tests.sh

# Run only E2E tests
./scripts/run-nightly-tests.sh --e2e-only

# Run only performance tests
./scripts/run-nightly-tests.sh --perf-only

# Run only unit tests
./scripts/run-nightly-tests.sh --unit-only

# Run E2E tests for specific browser
./scripts/run-nightly-tests.sh --e2e-only --project "Mobile Chrome"
```

## Test Reports

### Artifacts

The workflow generates these artifacts (retained for 30 days):
- Playwright reports for each browser configuration
- Test videos for failed tests (7 days retention)
- Lighthouse performance summaries
- Security scan reports
- Coverage reports
- Nightly test summary report (90 days retention)

### Automatic Issue Creation

When tests fail, the workflow automatically creates GitHub issues with:
- Failure summary
- Links to test artifacts
- Action items checklist
- Appropriate labels (nightly-test-failure, e2e/performance, high-priority)

Issues are deduplicated by date to avoid spam.

## Monitoring and Alerts

### Test Status

The test summary job aggregates results from all test suites and:
- Posts a summary as a workflow artifact
- Creates issues for failures (if enabled)
- Provides direct links to failed test details

### Cleanup

Old workflow runs and artifacts are automatically cleaned up after 30 days to manage storage.

## Debugging Failed Tests

### E2E Test Failures

1. Download the test artifacts from the workflow run
2. Check the playwright report for the specific browser
3. Review screenshots and videos of failed tests
4. Run locally with: `npx playwright test --project="browser-name" --debug`

### Performance Test Failures

1. Check the Lighthouse summary in artifacts
2. Review specific page scores
3. Run locally to reproduce: `./scripts/run-nightly-tests.sh --perf-only`
4. Use Chrome DevTools Lighthouse panel for detailed analysis

### Common Issues

**Hydration errors**: Often show up more in the full browser matrix
- Check for client-side only code without proper guards
- Review useState/useEffect patterns

**Performance regressions**: 
- Check recent image additions
- Review JavaScript bundle sizes
- Look for render-blocking resources

**Flaky tests**:
- Tests that pass locally but fail in CI
- Often due to timing issues or environment differences
- Use the debug mode to extend timeouts

## Maintenance

### Updating Test Thresholds

Performance thresholds are defined in:
- Workflow environment variables (for reporting)
- `.lighthouserc.json` (for actual assertions)

### Adding New Test Scenarios

1. Add test files to `tests/e2e/`
2. Ensure tests work with all language variants
3. Test locally with multiple browsers before committing

### Optimizing CI Time

The nightly tests are comprehensive but can be optimized by:
- Using test sharding across multiple runners
- Caching Playwright browsers more effectively
- Running only changed test files (with care to ensure coverage)