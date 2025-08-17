#!/bin/bash

# Test script to debug the workflow logic locally
set -e

echo "Testing Cloudflare worker list logic..."

# Simulate API responses for testing
test_empty_response() {
    echo '{"success":true,"result":[]}'
}

test_mixed_workers() {
    echo '{"success":true,"result":[
        {"id":"phialo-pr-123","created_on":"2024-01-01T00:00:00Z"},
        {"id":"phialo-pr-456","created_on":"2024-01-02T00:00:00Z"},
        {"id":"phialo-design","created_on":"2024-01-03T00:00:00Z"},
        {"id":"phialo-master","created_on":"2024-01-04T00:00:00Z"}
    ]}'
}

test_only_pr_workers() {
    echo '{"success":true,"result":[
        {"id":"phialo-pr-789","created_on":"2024-01-01T00:00:00Z"},
        {"id":"phialo-pr-012","created_on":"2024-01-02T00:00:00Z"}
    ]}'
}

test_only_other_workers() {
    echo '{"success":true,"result":[
        {"id":"phialo-design","created_on":"2024-01-01T00:00:00Z"},
        {"id":"phialo-master","created_on":"2024-01-02T00:00:00Z"}
    ]}'
}

# Function to test the list logic
test_list_logic() {
    local test_name=$1
    local response=$2
    local include_all=${3:-false}
    
    echo ""
    echo "========================================="
    echo "TEST: $test_name"
    echo "========================================="
    
    # Extract worker details (simulating the workflow)
    WORKERS_JSON=$(echo "$response" | jq -r '.result')
    ALL_WORKERS=$(echo "$WORKERS_JSON" | jq -r '.[].id' 2>/dev/null || echo "")
    
    if [ -z "$ALL_WORKERS" ]; then
        echo "✅ No workers found in the account"
        return 0
    fi
    
    # Count total workers
    TOTAL_COUNT=$(echo "$ALL_WORKERS" | wc -l | tr -d ' ')
    
    # Filter PR workers - THIS IS THE PROBLEMATIC LINE
    PR_WORKERS=$(echo "$ALL_WORKERS" | grep '^phialo-pr-[0-9]\+$' || echo "")
    if [ -n "$PR_WORKERS" ]; then
        PR_COUNT=$(echo "$PR_WORKERS" | wc -l | tr -d ' ')
    else
        PR_COUNT=0
        PR_WORKERS=""
    fi
    
    # Filter other workers - THIS IS ALSO PROBLEMATIC
    OTHER_WORKERS=$(echo "$ALL_WORKERS" | grep -v '^phialo-pr-[0-9]\+$' || echo "")
    if [ -n "$OTHER_WORKERS" ]; then
        OTHER_COUNT=$(echo "$OTHER_WORKERS" | wc -l | tr -d ' ')
    else
        OTHER_COUNT=0
        OTHER_WORKERS=""
    fi
    
    echo "📊 Summary:"
    echo "  Total workers: $TOTAL_COUNT"
    echo "  PR workers: $PR_COUNT"
    echo "  Other workers: $OTHER_COUNT"
    echo ""
    
    # Test PR workers listing
    if [ -n "$PR_WORKERS" ]; then
        echo "PR Workers found:"
        echo "$PR_WORKERS"
    else
        echo "No PR workers"
    fi
    
    # Test other workers listing
    if [ "$include_all" == "true" ] && [ -n "$OTHER_WORKERS" ]; then
        echo "Other Workers found:"
        echo "$OTHER_WORKERS"
    fi
    
    echo "✅ Test passed"
}

# Run all tests
echo "Running workflow logic tests..."

test_list_logic "Empty response" "$(test_empty_response)" "true"
test_list_logic "Mixed workers" "$(test_mixed_workers)" "true"
test_list_logic "Only PR workers" "$(test_only_pr_workers)" "true"
test_list_logic "Only other workers" "$(test_only_other_workers)" "true"

echo ""
echo "========================================="
echo "All tests completed!"
echo "========================================="