#!/bin/bash

# Script to analyze detailed step timings from GitHub Actions

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to calculate duration between timestamps
calc_duration() {
    local start=$1
    local end=$2
    
    # Convert to epoch seconds (macOS compatible)
    local start_epoch=$(date -jf "%Y-%m-%dT%H:%M:%SZ" "$start" +%s 2>/dev/null || echo 0)
    local end_epoch=$(date -jf "%Y-%m-%dT%H:%M:%SZ" "$end" +%s 2>/dev/null || echo 0)
    
    if [ "$start_epoch" -ne 0 ] && [ "$end_epoch" -ne 0 ]; then
        echo $((end_epoch - start_epoch))
    else
        echo 0
    fi
}

# Analyze a specific run
analyze_run() {
    local run_id=$1
    local workflow_name=$2
    
    echo -e "${BLUE}Analyzing run $run_id for $workflow_name${NC}"
    
    # Get all jobs and their steps
    local jobs=$(gh run view "$run_id" --json jobs 2>/dev/null || echo "{}")
    
    if [ "$jobs" = "{}" ]; then
        echo "Failed to get job data"
        return
    fi
    
    # Process each job
    echo "$jobs" | jq -r '.jobs[] | @base64' | while read -r job_data; do
        local job=$(echo "$job_data" | base64 --decode)
        local job_name=$(echo "$job" | jq -r '.name')
        local job_conclusion=$(echo "$job" | jq -r '.conclusion')
        
        echo -e "\n${GREEN}Job: $job_name (${job_conclusion})${NC}"
        echo "Step Timings:"
        echo "----------------------------------------"
        
        # Process steps
        echo "$job" | jq -r '.steps[] | @base64' | while read -r step_data; do
            local step=$(echo "$step_data" | base64 --decode)
            local step_name=$(echo "$step" | jq -r '.name')
            local started=$(echo "$step" | jq -r '.startedAt // "N/A"')
            local completed=$(echo "$step" | jq -r '.completedAt // "N/A"')
            
            if [ "$started" != "N/A" ] && [ "$completed" != "N/A" ]; then
                local duration=$(calc_duration "$started" "$completed")
                printf "%-50s %3ds\n" "$step_name" "$duration"
            fi
        done
        
        echo "----------------------------------------"
    done
}

# Main execution
if [ $# -eq 0 ]; then
    echo "Analyzing recent workflow runs..."
    
    # Get recent runs for key workflows
    for workflow in "pr-tests.yml" "nightly-tests.yml"; do
        echo -e "\n${YELLOW}=== $workflow ===${NC}"
        
        # Get the most recent successful run
        run_data=$(gh run list --workflow="$workflow" --limit=1 --status=success --json databaseId,displayTitle 2>/dev/null || echo "[]")
        
        if [ "$run_data" != "[]" ] && [ -n "$run_data" ]; then
            run_id=$(echo "$run_data" | jq -r '.[0].databaseId')
            title=$(echo "$run_data" | jq -r '.[0].displayTitle')
            
            echo "Latest successful run: $title"
            analyze_run "$run_id" "$workflow"
        else
            echo "No recent successful runs found"
        fi
    done
else
    # Analyze specific run ID
    analyze_run "$1" "manual"
fi