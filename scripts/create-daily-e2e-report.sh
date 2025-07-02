#!/bin/bash
# Script to manually create daily E2E test report

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Creating Daily E2E Test Report${NC}"

# Get date parameter or use today
DATE=${1:-$(date -u +%Y-%m-%d)}

echo -e "${YELLOW}Date: ${DATE}${NC}"

# Trigger the workflow
echo "Triggering daily E2E report workflow..."
gh workflow run daily-e2e-report.yml \
  -f test_date="${DATE}"

echo -e "${GREEN}✓ Workflow triggered successfully${NC}"
echo "Check the workflow run at: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions/workflows/daily-e2e-report.yml"

# Wait a bit and check status
echo "Waiting for workflow to start..."
sleep 5

# Get the latest run
RUN_ID=$(gh run list --workflow=daily-e2e-report.yml --limit=1 --json databaseId -q '.[0].databaseId')

if [ -n "$RUN_ID" ]; then
  echo -e "${GREEN}Workflow started with run ID: ${RUN_ID}${NC}"
  echo "View run: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions/runs/${RUN_ID}"
else
  echo -e "${RED}Could not find workflow run${NC}"
fi