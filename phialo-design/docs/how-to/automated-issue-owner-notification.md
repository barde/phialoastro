# Automated Issue Owner Notification

This document describes the automated workflow that notifies issue owners when a PR addressing their issue is created.

## Overview

When a pull request is created that references a GitHub issue (e.g., "Fixes #123"), the workflow automatically:

1. Extracts the issue number(s) from the PR title or body
2. Fetches the issue details to find the original reporter
3. Posts a comment on the PR tagging the issue owner
4. Only comments once per PR (prevents spam)

## How It Works

### Triggering Events
- When a PR is opened or updated
- When a check suite completes successfully

### Issue Detection
The workflow looks for issue references in the following formats:
- `#123` - Simple issue reference
- `Fixes #123` - GitHub closing keywords
- `Resolves #123, #124` - Multiple issues

### Comment Format
The bot posts a friendly message that:
- Tags the issue owner(s) with @mention
- Links to the referenced issue(s)
- Invites them to review the changes
- Includes a hidden marker to prevent duplicate comments

### Example Comment
```
Hi @username! 👋

This PR addresses the issue(s) you reported: #123

The automated tests have passed successfully. Please feel free to review the changes and let us know if they meet your requirements or if any adjustments are needed.

Thank you for reporting this issue!
```

## Configuration

The workflow is defined in `.github/workflows/notify-issue-owner.yml` and requires:
- `contents: read` - To checkout code
- `issues: read` - To fetch issue details
- `pull-requests: write` - To post comments

## Edge Cases Handled

1. **PR author is issue owner**: No comment is posted (avoids self-notification)
2. **Multiple issues**: All unique issue owners are notified
3. **Invalid issue numbers**: Gracefully skipped with console logging
4. **Duplicate comments**: Prevented by checking for existing bot comments

## Testing

To test this workflow:
1. Create an issue from a different account
2. Create a PR that references that issue
3. Verify the issue owner receives a notification comment

## Maintenance

The workflow uses GitHub's built-in `GITHUB_TOKEN` and requires no additional secrets or configuration.