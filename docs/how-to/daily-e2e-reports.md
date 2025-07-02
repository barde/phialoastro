# Daily E2E Test Reports

## Overview

The Daily E2E Test Report system provides automated tracking and reporting of nightly end-to-end test results. A GitHub issue is created or updated daily with comprehensive test statistics, pass/fail information, and actionable items.

## Features

- **Automated Daily Reports**: Runs at 3 AM UTC (after nightly tests complete)
- **Comprehensive Statistics**: Tracks total tests, passed, failed, and skipped
- **Issue Management**: Creates or updates a daily issue with results
- **Failure Tracking**: Highlights failures and provides action items
- **Historical Records**: Maintains a searchable history of test results

## Report Contents

Each daily report includes:

1. **Test Summary**
   - Overall status (✅ Passed, ❌ Failed, 🔧 Startup failure, etc.)
   - Last update timestamp
   - Test date

2. **Test Statistics**
   - Total E2E tests run
   - Number passed
   - Number failed
   - Number skipped

3. **Run Details** (if tests ran)
   - Link to workflow run
   - Run ID
   - Download link for test artifacts

4. **Test Coverage Information**
   - Cross-browser testing details
   - Mobile viewport testing
   - Visual regression testing
   - Performance testing
   - Security scanning
   - Accessibility testing

5. **Action Items**
   - Contextual tasks based on test results
   - Checkboxes for tracking resolution

## Usage

### Automatic Reports

The daily report runs automatically via GitHub Actions:
- Schedule: 3 AM UTC daily
- Creates/updates issue with label `daily-e2e-report`
- Closes issues automatically when all tests pass

### Manual Report Generation

To generate a report for a specific date:

```bash
# Generate report for today
./scripts/create-daily-e2e-report.sh

# Generate report for specific date
./scripts/create-daily-e2e-report.sh 2025-07-01
```

Or via GitHub Actions UI:
1. Go to Actions → Daily E2E Test Report
2. Click "Run workflow"
3. Optionally specify a date (YYYY-MM-DD)
4. Click "Run workflow"

### Finding Reports

Daily reports can be found by:
- Label: `daily-e2e-report`
- Title format: `📊 Daily E2E Test Report - YYYY-MM-DD`
- In Issues tab with automated reports

## Report States

### ✅ All Tests Passed
- Issue is automatically closed
- No action items required
- Green success label applied

### ❌ Tests Failed
- Issue remains open
- Failure details provided
- Action items for investigation
- Red failure label applied

### 🔧 Startup Failure
- Indicates workflow configuration issues
- Provides troubleshooting steps
- Requires infrastructure investigation

### ⏭️ No Tests Run
- No nightly test execution found
- Provides possible causes
- Links to workflow configuration

## Troubleshooting

### No Daily Report Created

1. Check if workflow is enabled:
   ```bash
   gh workflow list | grep "Daily E2E"
   ```

2. Check recent runs:
   ```bash
   gh run list --workflow=daily-e2e-report.yml
   ```

3. Enable workflow if disabled:
   ```bash
   gh workflow enable daily-e2e-report.yml
   ```

### Incorrect Test Statistics

The report pulls data from the nightly test run. If statistics seem wrong:
1. Check the nightly test run for the date
2. Verify job names include "e2e-tests" or "E2E Tests"
3. Check workflow logs for parsing errors

### Missing Test Runs

If no test run is found for a date:
1. Verify nightly tests are scheduled and enabled
2. Check for infrastructure issues on that date
3. Look for workflow startup failures

## Configuration

The daily report workflow can be customized in `.github/workflows/daily-e2e-report.yml`:

- **Schedule**: Modify the cron expression
- **Labels**: Update issue labels
- **Report Format**: Customize the issue body template
- **Test Detection**: Adjust job name filters

## Integration with Nightly Tests

The daily report system works in conjunction with:
- `nightly-tests.yml`: The main test execution workflow
- Test artifacts: Downloaded and linked in reports
- Failure notifications: Separate from immediate failure alerts

## Best Practices

1. **Review Daily**: Check the daily report each morning
2. **Act on Failures**: Address failing tests promptly
3. **Track Trends**: Monitor for flaky tests or recurring issues
4. **Update Documentation**: Keep test coverage section current
5. **Clean Up**: Periodically close old report issues

## Example Report

```markdown
## ✅ Daily E2E Test Summary

**Last Updated**: 2025-07-02 03:00:15 UTC
**Date**: 2025-07-02
**Status**: All tests passed

### Test Statistics

| Metric | Count |
|--------|-------|
| **Total E2E Tests** | 18 |
| **✅ Passed** | 18 |
| **❌ Failed** | 0 |
| **⏭️ Skipped** | 0 |

### Test Run Details

- **Workflow Run**: [View Run](https://github.com/barde/phialoastro/actions/runs/12345)
- **Run ID**: 12345
- **Test Report**: [Download Artifact](...)

### Actions

- [x] All tests passed - no action needed
```

## Related Documentation

- [Nightly Tests Guide](./nightly-tests.md)
- [E2E Testing Strategy](./E2E-TESTING-STRATEGY.md)
- [CI/CD Overview](../architecture/CI-CD-OVERVIEW.md)