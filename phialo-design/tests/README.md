# Phialo Design Test Suite

This directory contains comprehensive tests for the Phialo Design website, including both unit tests and end-to-end (E2E) tests.

## Test Structure

```
tests/
├── e2e/                      # Playwright E2E tests
│   ├── navigation.spec.ts    # Logo navigation and language switching (Issue #21)
│   ├── portfolio-modal.spec.ts # Portfolio modal language detection (Issue #22)
│   ├── contact-info.spec.ts  # Phone number in footer and contact (Issue #7)
│   ├── landing-page.spec.ts  # Clean landing page without animations (Issue #4)
│   ├── dark-mode.spec.ts     # Dark mode functionality (Issue #12)
│   ├── responsive.spec.ts    # Responsive design and mobile behavior
│   ├── accessibility.spec.ts # Accessibility compliance
│   └── integration.spec.ts   # Full user journey tests
└── README.md

src/test/                     # Unit tests
├── components/
│   ├── common/
│   │   ├── ThemeProvider.test.tsx
│   │   ├── ThemeToggle.test.tsx
│   │   └── PortfolioModal.test.tsx
│   └── layout/
│       ├── Navigation.test.tsx
│       └── Header.test.tsx
└── setup.ts                  # Test configuration
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug

# Run specific test file
npx playwright test navigation.spec.ts

# Run tests in headed mode
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=chromium
```

## Test Coverage

### Issue #21: Logo Navigation
- ✅ Logo navigates to German homepage from German pages
- ✅ Logo navigates to English homepage from English pages
- ✅ Correct aria-labels in both languages
- ✅ Unit tests for Header component

### Issue #22: Portfolio Modal Language
- ✅ German text displayed on German pages
- ✅ English text displayed on English pages
- ✅ Language persistence across modal interactions
- ✅ Comprehensive unit tests for PortfolioModal

### Issue #7: Contact Information
- ✅ Phone number visible in footer
- ✅ Phone number clickable (tel: link)
- ✅ Phone number on contact page
- ✅ All contact methods accessible

### Issue #4: Landing Page
- ✅ No floating/hovering elements
- ✅ No mouse scroll indicators
- ✅ Clean, minimal hero section
- ✅ Subtle background without animations

### Issue #12: Dark Mode
- ✅ Theme toggle button functionality
- ✅ Theme persistence across navigation
- ✅ Smooth transitions
- ✅ Proper color application
- ✅ System preference detection
- ✅ Unit tests for ThemeProvider and ThemeToggle

## CI/CD Integration

The tests are configured to run in CI environments:

1. **Unit Tests**: Run on every commit
2. **E2E Tests**: Run on pull requests and before deployment
3. **Accessibility Tests**: Included in E2E suite

## Local Development

When developing locally:

1. Ensure the dev server is running on port 4322:
   ```bash
   npm run dev -- --port 4322
   ```

2. Run tests in watch mode for immediate feedback:
   ```bash
   npm test          # Unit tests
   npm run test:e2e:ui  # E2E tests with UI
   ```

## Best Practices

1. **Write tests before fixing bugs** to ensure the issue is properly captured
2. **Use data-testid attributes** for reliable element selection
3. **Test both happy paths and edge cases**
4. **Ensure tests are independent** and can run in any order
5. **Mock external dependencies** in unit tests
6. **Use Page Object Model** for complex E2E test scenarios

## Debugging

### Unit Tests
- Use `console.log` in tests
- Run specific test: `npm test -- Navigation.test.tsx`
- Use VSCode debugger with Vitest extension

### E2E Tests
- Use `page.pause()` to pause execution
- Take screenshots: `await page.screenshot({ path: 'debug.png' })`
- Use `--debug` flag for step-by-step execution
- View test reports in `playwright-report/`

## Maintenance

- Update tests when adding new features
- Review and update test data regularly
- Keep test dependencies up to date
- Monitor test execution time and optimize slow tests