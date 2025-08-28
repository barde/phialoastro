# Fix: E2E Single Issue Reporting

## Problem
The current e2e automation creates a new GitHub issue for every daily test run, leading to issue spam (e.g., issues #236-#246).

## Solution
The workflow has been updated to use a single tracking issue that gets updated with new results instead of creating new issues.

## Changes Made
1. Modified `.github/workflows/daily-e2e-report.yml`:
   - Changed to search for a single issue with title "📊 E2E Test Results Tracker" and label `e2e-tracker`
   - New results are prepended to the existing issue body
   - Added comment notifications for each update
   - Maintains full history of all test runs in the issue body

2. Closed all existing daily e2e report issues (#236-#246)

## Manual Steps Required
Since the workflow file cannot be pushed due to OAuth scope limitations, you'll need to:

1. Apply the changes from the local branch:
   ```bash
   git checkout fix-e2e-single-issue-reporting
   git show HEAD:.github/workflows/daily-e2e-report.yml > workflow-changes.yml
   ```

2. Manually update the workflow file through GitHub UI or with proper permissions

3. The next time the workflow runs, it will create a single tracking issue and update it going forward

## Testing
- The workflow can be manually triggered via workflow_dispatch
- Or wait for the scheduled run at 3 AM UTC daily