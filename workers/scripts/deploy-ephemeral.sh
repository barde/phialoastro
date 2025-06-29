#!/bin/bash
# Script to deploy ephemeral preview environments with proper static asset support

set -e

# Check required parameters
if [ -z "$1" ]; then
  echo "Usage: $0 <pr-number>"
  exit 1
fi

PR_NUMBER=$1
WORKER_NAME="phialo-pr-${PR_NUMBER}"

# Create a temporary wrangler.toml for this deployment
cat > wrangler-ephemeral.toml << EOF
name = "${WORKER_NAME}"
main = "src/index.ts"
compatibility_date = "2024-09-25"
workers_dev = true

[assets]
directory = "../phialo-design/dist"
binding = "ASSETS"

[vars]
ENVIRONMENT = "preview"
PR_NUMBER = "${PR_NUMBER}"
EOF

echo "Created ephemeral configuration for ${WORKER_NAME}"
echo "Deploying..."

# Deploy using the temporary configuration
npx wrangler deploy --config wrangler-ephemeral.toml

# Clean up
rm -f wrangler-ephemeral.toml

echo "Deployment complete!"