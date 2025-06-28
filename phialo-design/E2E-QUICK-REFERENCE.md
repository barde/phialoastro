# E2E Testing Quick Reference

## 🚀 Quick Start

### Run Tests by Speed
```bash
npm run test:e2e:smoke      # <1 minute - Critical paths only
npm run test:e2e:critical   # 3-5 minutes - PR tests
npm run test:e2e            # 10-15 minutes - Full suite
npm run test:e2e:ai         # AI-powered tests
npm run test:e2e:browserstack # Real device tests
```

### Essential Commands
```bash
# Debug a specific test
npm run test:e2e:debug -- --grep "test name"

# Run tests in UI mode
npm run test:e2e:ui

# Update snapshots
npm run test:e2e -- --update-snapshots

# Run specific test file
npx playwright test tests/e2e/smoke.spec.ts
```

## 🏷️ Test Tags

| Tag | Purpose | When to Use |
|-----|---------|-------------|
| `@smoke` | Ultra-fast core tests | Every commit |
| `@critical` | Must-pass PR tests | Pull requests |
| `@ai` | AI-powered tests | Feature testing |
| `@browserstack` | Real device tests | Release testing |
| `@visual` | Screenshot tests | UI changes |
| `@slow` | Long-running tests | Nightly only |

## 🤖 AI Testing

### Setup
```bash
export ZEROSTEP_API_TOKEN=your_token_here
npm run test:e2e:ai
```

### Usage Examples
```typescript
// Natural language interaction
await ai('Click the submit button', { page, test });
await ai('Fill in the email field with test@example.com', { page, test });
await ai('Verify the success message appears', { page, test });

// Self-healing selectors
await selectors.click({
  testId: 'submit-btn',
  text: 'Submit',
  aiDescription: 'The blue submit button'
});
```

## 📱 BrowserStack Testing

### Credentials (for demo)
- Username: `bartholomusdeder_nJUBTZ`
- Access Key: `LR111gJnb7cEqyzUbjiL`

### Run on Specific Devices
```bash
# iPhone testing
npx playwright test --config=playwright.browserstack.config.ts --project="iPhone-14-Pro"

# Desktop Chrome
npx playwright test --config=playwright.browserstack.config.ts --project="Chrome@latest-Windows"
```

## ⚡ Performance Tips

### Make Tests Faster
1. Use `@smoke` tag for quick feedback loops
2. Run tests in parallel with sharding
3. Skip visual tests in PRs
4. Use AI for complex selectors

### Reduce Flakiness
1. Use `expect().toBeVisible()` instead of `waitForTimeout()`
2. Add `@ai` for self-healing capabilities
3. Increase timeout for BrowserStack tests
4. Use proper wait conditions

## 🛠️ Troubleshooting

### Common Fixes

| Problem | Solution |
|---------|----------|
| Test timeout | Increase timeout in config or use `test.setTimeout()` |
| Element not found | Use AI selectors or add data-testid |
| Flaky test | Add retries or use self-healing |
| Slow tests | Use smoke tests or enable sharding |
| AI not working | Check ZEROSTEP_API_TOKEN env var |

### Debug Tools
```bash
# Generate trace for failed test
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip

# See browser UI during test
npx playwright test --headed

# Pause at specific point
await page.pause();  // Add to test code
```

## 📊 Test Configurations

| Config File | Purpose | Execution Time | Workers |
|------------|---------|----------------|---------|
| `playwright.smoke.config.ts` | Quick validation | <1 min | 8 |
| `playwright.pr.config.ts` | PR validation | 3-5 min | 4 |
| `playwright.config.ts` | Full suite | 10-15 min | 4 |
| `playwright.ai.config.ts` | AI testing | Variable | 2 |
| `playwright.browserstack.config.ts` | Real devices | 15-30 min | 5 |
| `playwright.shard.config.ts` | Parallel shards | Divided | 2/shard |

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
# Run smoke tests
- run: npm run test:e2e:smoke

# Run with sharding
- run: npm run test:e2e
  env:
    SHARD_INDEX: ${{ matrix.shard }}
    TOTAL_SHARDS: 4
```

### Required for PR Merge
- ✅ All smoke tests pass
- ✅ All critical tests pass
- ✅ E2E tests are **non-skippable**

## 📈 Metrics & Reports

### View Reports
- **HTML Report:** `npx playwright show-report`
- **AI Insights:** `cat ai-insights-report.json`
- **GitHub Summary:** Check Actions tab
- **BrowserStack:** Dashboard link in logs

### Key Metrics
- Test execution time
- Pass/fail rate
- AI operation count
- Self-healing success rate
- Device-specific failures

---

💡 **Pro Tip:** Start with `npm run test:e2e:smoke` for quick validation, then run fuller suites as needed!