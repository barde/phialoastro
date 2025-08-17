#!/bin/bash

# Full test of the workflow including all actions
set -euo pipefail

echo "Full workflow test with error handling..."

# Test the actual workflow code with different scenarios
test_workflow_list() {
    echo "Testing LIST action..."
    
    # Simulate the exact workflow code
    RESPONSE='{"success":true,"result":[]}'
    
    # Check if the API call was successful
    if ! echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        echo "❌ Failed to fetch workers from Cloudflare API"
        return 1
    fi
    
    # Extract worker details
    WORKERS_JSON=$(echo "$RESPONSE" | jq -r '.result')
    
    # Check if result is null or empty array
    if [ "$WORKERS_JSON" = "null" ] || [ "$WORKERS_JSON" = "[]" ]; then
        ALL_WORKERS=""
    else
        ALL_WORKERS=$(echo "$WORKERS_JSON" | jq -r '.[].id' 2>/dev/null || echo "")
    fi
    
    if [ -z "$ALL_WORKERS" ]; then
        echo "✅ No workers found in the account"
        return 0
    fi
    
    # Continue with the rest of the logic...
    echo "Workers found, processing..."
}

test_workflow_delete_pr() {
    echo "Testing DELETE-PR-WORKERS action..."
    
    # Test with empty response
    RESPONSE='{"success":true,"result":[]}'
    ALL_WORKERS=$(echo "$RESPONSE" | jq -r '.result[].id' 2>/dev/null || echo "")
    
    if [ -z "$ALL_WORKERS" ]; then
        echo "No workers to process"
    fi
    
    PR_WORKERS=$(echo "$ALL_WORKERS" | grep '^phialo-pr-[0-9]\+$' 2>/dev/null || echo "")
    
    if [ -z "$PR_WORKERS" ] || [ "$PR_WORKERS" = "" ]; then
        echo "✅ No PR workers found"
        return 0
    fi
    
    echo "Would delete PR workers..."
}

test_workflow_delete_specific() {
    echo "Testing DELETE-SPECIFIC-WORKER action..."
    
    WORKER_NAME="phialo-pr-123"
    
    if [ -z "$WORKER_NAME" ]; then
        echo "❌ Error: Worker name is required"
        return 1
    fi
    
    # Simulate checking if worker exists
    RESPONSE='{"success":false,"errors":[{"code":10001,"message":"not found"}]}'
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "Worker found, would delete: $WORKER_NAME"
    else
        echo "Worker not found: $WORKER_NAME"
    fi
}

# Run all tests
test_workflow_list
echo ""
test_workflow_delete_pr
echo ""
test_workflow_delete_specific

echo ""
echo "All workflow tests completed!"