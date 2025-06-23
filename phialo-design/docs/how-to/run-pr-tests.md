# How to Run PR Tests

This guide explains how to use the optimized PR test configuration for fast feedback during pull requests.

## Overview

The `playwright.pr.config.ts` file is specifically designed to run a subset of critical tests quickly (target: 5-10 minutes) while still providing confidence that the main functionality works correctly.

## Running PR Tests

### Quick Method - Simulate Full PR Check

The easiest way to run PR tests locally is using the dedicated script:

```bash
# Run the same checks that GitHub Actions runs during PR
./scripts/test-pr-local.sh
```

This script will:
- Run linting checks
- Run TypeScript type checking  
- Run unit tests (single Node version)
- Run core E2E tests (5 critical test files)
- Build the project
- Display timing information and colored output
- Show which tests are being skipped vs run

### Manual Method - Individual Commands

```bash
# Run all tests marked as @critical
npx playwright test --config=playwright.pr.config.ts

# Run specific test file with PR config
npx playwright test tests/e2e/navigation.spec.ts --config=playwright.pr.config.ts

# Run with UI mode for debugging
npx playwright test --config=playwright.pr.config.ts --ui
```

### In CI (GitHub Actions)

The PR config is automatically used when the `TEST_CONFIG` environment variable is set:

```yaml
- name: Run PR Tests
  run: npx playwright test --config=playwright.pr.config.ts
  env:
    CI: true
```

## Marking Tests as Critical

To include a test in PR runs, add the `@critical` tag to the test name:

```typescript
// This test WILL run in PR tests
test('@critical Language switching works correctly', async ({ page }) => {
  // test implementation
});

// This test will NOT run in PR tests
test('Detailed accessibility check for all pages', async ({ page }) => {
  // test implementation
});
```

### What Makes a Test Critical?

A test should be marked as `@critical` if it:

1. **Tests core user journeys** (e.g., can users navigate the site?)
2. **Validates business-critical features** (e.g., contact form submission)
3. **Checks for common regressions** (e.g., language switching, mobile responsiveness)
4. **Runs quickly** (< 30 seconds per test)

### Examples of Critical Tests

```typescript
// Navigation - users must be able to move around the site
test('@critical Main navigation menu works on desktop', async ({ page }) => {
  // ...
});

// Language switching - bilingual functionality is core
test('@critical Language selector switches content correctly', async ({ page }) => {
  // ...
});

// Contact form - main conversion point
test('@critical Contact form submits successfully', async ({ page }) => {
  // ...
});

// Mobile responsiveness - majority of users
test('@critical Site is usable on mobile devices', async ({ page }) => {
  // ...
});

// Portfolio display - main content showcase
test('@critical Portfolio items load and display correctly', async ({ page }) => {
  // ...
});
```

### Examples of Non-Critical Tests (for nightly runs)

```typescript
// Comprehensive but slow
test('All portfolio filters work with all combinations', async ({ page }) => {
  // ...
});

// Edge cases
test('Contact form handles 10000 character message', async ({ page }) => {
  // ...
});

// Visual regression tests
test('Screenshot comparison for all pages', async ({ page }) => {
  // ...
});

// SEO and meta tags
test('All pages have correct meta descriptions', async ({ page }) => {
  // ...
});
```

## PR Test Configuration Features

### Speed Optimizations

1. **Reduced timeouts**: 15s per test (vs 30s in base config)
2. **Minimal retries**: 1 retry in CI (vs 2)
3. **4 parallel workers**: Optimal for GitHub Actions runners
4. **Minimal browser set**: Only 4 browser/device combinations
5. **No video recording**: Screenshots only on failure
6. **Blocked service workers**: Faster page loads

### Browser Coverage

The PR config tests on:
- **Desktop Chrome** - Most common desktop browser
- **Desktop Firefox** - Cross-browser compatibility
- **Mobile Safari (iPhone 12)** - iOS mobile experience
- **Mobile Chrome (Pixel 5)** - Android mobile experience

### Test Selection Strategies

You can use either approach:

1. **Tag-based** (recommended):
   ```typescript
   grep: /@critical/,
   ```

2. **File-based** (alternative):
   ```typescript
   testMatch: [
     '**/navigation.spec.ts',
     '**/contact-form.spec.ts',
     // ... specific files
   ],
   ```

## Best Practices

1. **Keep critical tests focused**: Each test should validate one specific user journey
2. **Avoid complex setups**: Critical tests should be self-contained
3. **Use data-testid attributes**: Make tests more reliable and faster
4. **Skip animations in tests**: Use `page.addInitScript()` to disable animations
5. **Parallelize independent tests**: Don't use `test.serial` for critical tests

## Monitoring Test Performance

```bash
# Generate timing report
npx playwright test --config=playwright.pr.config.ts --reporter=json > test-timings.json

# View slowest tests
cat test-timings.json | jq '.suites[].suites[].tests[] | {title: .title, duration: .duration} | select(.duration > 10000)'
```

## Migrating Existing Tests

To add critical tests to existing test files:

```typescript
// Before
test('Language switching works correctly', async ({ page }) => {
  // ...
});

// After
test('@critical Language switching works correctly', async ({ page }) => {
  // ...
});
```

## Troubleshooting

### Tests running too slowly

1. Check for unnecessary `page.waitForTimeout()` calls
2. Use `page.waitForLoadState('domcontentloaded')` instead of `'load'`
3. Reduce test data size (e.g., test with 3 items instead of 50)

### Flaky tests

1. Add explicit waits: `await page.waitForSelector('.element', { state: 'visible' })`
2. Check for race conditions in language switching
3. Ensure proper test isolation

### Running full test suite

For comprehensive testing (nightly runs or before release):

```bash
# Use base config for all tests
npx playwright test

# Or use nightly config for maximum coverage
npx playwright test --config=playwright.nightly.config.ts
```

## Script Comparison

### Available Test Scripts

| Script | Purpose | What it runs | When to use |
|--------|---------|--------------|-------------|
| `./scripts/test-pr-local.sh` | Simulate PR checks | Lint, typecheck, unit tests, 5 core E2E tests, build | Before creating a PR |
| `./scripts/test-pr.sh` | Basic PR test runner | Unit tests, core E2E tests, build | Quick PR validation |
| `./scripts/run-nightly-tests.sh` | Full test suite | All unit tests with coverage, all E2E tests, performance tests | Comprehensive testing |

### Key Differences

- **test-pr-local.sh**: Most comprehensive PR simulation with linting and type checking
- **test-pr.sh**: Simpler version without lint/typecheck steps
- **run-nightly-tests.sh**: Full suite including performance testing and all browser combinations