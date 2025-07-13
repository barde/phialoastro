#!/bin/bash

# Script to clean up unused Cloudflare Workers
# This script should be run manually with proper Cloudflare API credentials

set -e

echo "Worker Cleanup Script"
echo "===================="
echo ""
echo "This script will help identify and clean up unused Cloudflare Workers."
echo "You'll need to run this with proper authentication."
echo ""

# List of expected workers
EXPECTED_WORKERS=(
  "phialo-design"           # Production
  "phialo-design-preview"   # Preview environment
  # PR preview workers follow pattern: phialo-pr-{number}
)

# Workers that might need cleanup (found during investigation)
POTENTIALLY_UNUSED=(
  "phialo-pr-211-preview"   # Incorrect naming pattern
  # Add more as discovered
)

echo "Expected workers:"
for worker in "${EXPECTED_WORKERS[@]}"; do
  echo "  - $worker"
done
echo ""

echo "Potentially unused workers:"
for worker in "${POTENTIALLY_UNUSED[@]}"; do
  echo "  - $worker"
done
echo ""

echo "To list all workers in your account:"
echo "  curl -X GET \"https://api.cloudflare.com/client/v4/accounts/\$CLOUDFLARE_ACCOUNT_ID/workers/scripts\" \\"
echo "       -H \"Authorization: Bearer \$CLOUDFLARE_API_TOKEN\" \\"
echo "       -H \"Content-Type: application/json\" | jq -r '.result[].id'"
echo ""

echo "To check if a specific worker exists:"
echo "  npx wrangler deployments list --name \"worker-name\""
echo ""

echo "To delete an unused worker:"
echo "  npx wrangler delete --name \"worker-name\" --force"
echo ""

echo "To clean up all PR preview workers (be careful!):"
echo "  for i in {1..300}; do"
echo "    npx wrangler delete --name \"phialo-pr-\$i\" --force 2>/dev/null || true"
echo "  done"
echo ""

echo "Remember to:"
echo "1. Export CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID"
echo "2. Be careful not to delete production or preview workers"
echo "3. Check each worker before deletion"