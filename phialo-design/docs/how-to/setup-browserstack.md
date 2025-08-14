# Setting Up BrowserStack Integration

This guide explains how to configure BrowserStack for automated cross-browser testing in the Phialo Design project.

## Prerequisites

1. **BrowserStack Account**: Apply for the [BrowserStack Open Source Program](https://www.browserstack.com/open-source) to get free access with 5 parallel sessions.
2. **GitHub Repository Access**: Admin access to add secrets to the repository.

## Step 1: Obtain BrowserStack Credentials

1. Log in to your [BrowserStack Dashboard](https://www.browserstack.com/accounts/settings)
2. Navigate to **Settings** → **Access Keys**
3. Note your **Username** and **Access Key**

## Step 2: Add GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `BROWSERSTACK_USERNAME` | Your BrowserStack username | Found in BrowserStack account settings |
| `BROWSERSTACK_ACCESS_KEY` | Your BrowserStack access key | Keep this secure, never commit to code |

## Step 3: Local Development Setup

For local testing with BrowserStack, create a `.env.local` file:

### Method 1: Copy from Example (Recommended)

```bash
# Navigate to phialo-design directory
cd phialo-design

# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and add your credentials
# Use your favorite editor (vim, nano, code, etc.)
```

### Method 2: Create Manually

Create a file at `phialo-design/.env.local` with:

```env
# BrowserStack credentials
BROWSERSTACK_USERNAME=your_actual_username
BROWSERSTACK_ACCESS_KEY=your_actual_access_key
```

### Method 3: Export Variables (Temporary)

```bash
# Set environment variables for current session only
export BROWSERSTACK_USERNAME="your_username"
export BROWSERSTACK_ACCESS_KEY="your_access_key"
```

**Important Notes:**
- ✅ The `.env.local` file is already in `.gitignore`
- ⚠️ Never commit `.env.local` to version control
- 📍 Location must be: `phialo-design/.env.local` (not in root directory)

## Step 4: Running BrowserStack Tests

### Local Testing

```bash
# Run all BrowserStack tests
pnpm run test:e2e:browserstack

# Run specific browser
pnpm playwright test --config=playwright.browserstack.config.ts --project="Chrome@latest-Windows"

# Run with specific tags
pnpm playwright test --config=playwright.browserstack.config.ts --grep @critical
```

### CI/CD Testing

Tests run automatically on:
- **Main branch merges**: Full browser matrix (6 browsers)
- **PR with label**: Add `run-browserstack` label to trigger tests
- **Production deployments**: Smoke tests on critical browsers
- **Nightly builds**: Rotating browser coverage

## Step 5: Monitoring Test Results

### BrowserStack Dashboard

1. Log in to [BrowserStack Automate](https://automate.browserstack.com/)
2. View test results with:
   - Video recordings of test runs
   - Network logs and console logs
   - Screenshots at failure points
   - Device/browser metadata

### GitHub Actions

1. Check workflow runs in the **Actions** tab
2. Download HTML reports from failed runs
3. Review annotations on PR files

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Verify secrets are correctly set in GitHub
   - Check credentials haven't expired
   - Ensure no extra spaces in secret values

2. **Parallel Session Limit**
   - Maximum 5 parallel sessions with Open Source account
   - Reduce `workers` in config if hitting limits
   - Check no other tests are running simultaneously

3. **Local Testing Issues**
   - Install BrowserStack Local for testing local URLs:
     ```bash
     npm install -g browserstack-local
     BrowserStackLocal --key YOUR_ACCESS_KEY
     ```
   - Set `BS_LOCAL=true` when running tests

4. **Test Timeouts**
   - Real devices may be slower than local browsers
   - Adjust timeouts in `playwright.browserstack.config.ts`
   - Consider using `@critical` tag for faster test subset

## Best Practices

1. **Tag Management**
   - Use `@browserstack` for BrowserStack-specific tests
   - Use `@critical` for must-pass tests on all browsers
   - Use `@smoke` for quick production validation

2. **Browser Selection**
   - Focus on your user demographics
   - Test latest 2 versions of major browsers
   - Include both iOS and Android mobile devices

3. **Parallel Optimization**
   - Use matrix strategy in GitHub Actions
   - Distribute tests evenly across browsers
   - Monitor session utilization in BrowserStack dashboard

4. **Cost Management**
   - Even with unlimited testing, optimize for efficiency
   - Use smart browser rotation for comprehensive coverage
   - Run full matrix only on main branch and releases

## Support

- [BrowserStack Documentation](https://www.browserstack.com/docs)
- [Playwright BrowserStack Guide](https://playwright.dev/docs/test-runners#browserstack)
- [GitHub Issues](https://github.com/yourusername/phialo-design/issues)