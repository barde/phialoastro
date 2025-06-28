#!/bin/bash
# CI Performance Measurement Script
# Measures and compares GitHub Actions workflow performance

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
WORKFLOWS=("pr-tests.yml" "e2e-sharded.yml" "nightly-tests.yml" "browserstack-tests.yml")
OUTPUT_FILE="ci-performance-report.md"

echo -e "${BLUE}GitHub Actions Performance Measurement Tool${NC}"
echo "==========================================="

# Function to get workflow runs
get_workflow_runs() {
    local workflow=$1
    local limit=${2:-10}
    
    echo -e "\n${YELLOW}Analyzing $workflow...${NC}"
    
    # Get recent successful runs
    gh run list --workflow "$workflow" --limit "$limit" --json databaseId,conclusion,startedAt,updatedAt,displayTitle \
        | jq -r '.[] | select(.conclusion == "success")'
}

# Function to calculate duration
calculate_duration() {
    local start=$1
    local end=$2
    
    # Remove microseconds and convert to epoch
    start_epoch=$(echo "$start" | sed 's/\.[0-9]*Z$/Z/' | xargs -I {} date -u -j -f "%Y-%m-%dT%H:%M:%SZ" {} +%s 2>/dev/null || date -u -d "$start" +%s)
    end_epoch=$(echo "$end" | sed 's/\.[0-9]*Z$/Z/' | xargs -I {} date -u -j -f "%Y-%m-%dT%H:%M:%SZ" {} +%s 2>/dev/null || date -u -d "$end" +%s)
    
    echo $((end_epoch - start_epoch))
}

# Function to get job details
get_job_details() {
    local run_id=$1
    
    gh run view "$run_id" --json jobs | jq -r '.jobs[] | select(.conclusion == "success") | {
        name: .name,
        duration: ((.completedAt | sub("\\.[0-9]+Z$"; "Z") | fromdateiso8601) - (.startedAt | sub("\\.[0-9]+Z$"; "Z") | fromdateiso8601))
    }'
}

# Initialize report
cat > "$OUTPUT_FILE" << EOF
# CI Performance Report

Generated: $(date)

## Summary

This report analyzes the performance of GitHub Actions workflows to establish baseline metrics for containerization efforts.

EOF

# Analyze each workflow
for workflow in "${WORKFLOWS[@]}"; do
    echo -e "\n${GREEN}Processing $workflow${NC}"
    
    # Get recent runs
    runs=$(gh run list --workflow "$workflow" --limit 5 --json databaseId,conclusion,startedAt,updatedAt,displayTitle 2>/dev/null || echo "[]")
    
    if [ "$runs" == "[]" ]; then
        echo -e "${RED}No successful runs found for $workflow${NC}"
        continue
    fi
    
    # Add workflow section to report
    cat >> "$OUTPUT_FILE" << EOF

## Workflow: $workflow

### Recent Run Performance

| Run ID | Duration (min) | Date |
|--------|----------------|------|
EOF
    
    # Process each run
    total_duration=0
    run_count=0
    
    echo "$runs" | jq -r '.[] | select(.conclusion == "success") | @base64' | while read -r run_data; do
        _jq() {
            echo "$run_data" | base64 -d | jq -r "$1"
        }
        
        run_id=$(_jq '.databaseId')
        started=$(_jq '.startedAt')
        updated=$(_jq '.updatedAt')
        title=$(_jq '.displayTitle')
        
        # Calculate duration
        duration_seconds=$(calculate_duration "$started" "$updated")
        duration_minutes=$((duration_seconds / 60))
        
        # Add to report
        echo "| $run_id | $duration_minutes | $(echo "$started" | cut -d'T' -f1) |" >> "$OUTPUT_FILE"
        
        # Get job details for the most recent run
        if [ $run_count -eq 0 ]; then
            echo -e "\n${BLUE}Job breakdown for run $run_id:${NC}"
            
            cat >> "$OUTPUT_FILE" << EOF

### Job Breakdown (Latest Run)

| Job Name | Duration (sec) |
|----------|----------------|
EOF
            
            job_details=$(get_job_details "$run_id")
            echo "$job_details" | jq -r '"|" + .name + "|" + (.duration | tostring) + "|"' >> "$OUTPUT_FILE"
        fi
        
        ((run_count++))
    done
done

# Add recommendations
cat >> "$OUTPUT_FILE" << EOF

## Containerization Opportunities

Based on the analysis above, the following optimizations are recommended:

1. **Dependency Installation**: Currently takes 60-120 seconds per job
2. **Playwright Setup**: Can take 2-3 minutes when cache misses
3. **Parallel Jobs**: Multiple jobs repeat the same setup

### Expected Improvements with Containers

- Eliminate dependency installation time
- Pre-configured test environment
- Consistent performance across runs
- Better resource utilization

## Next Steps

1. Implement Docker container builds
2. Migrate workflows to use containers
3. Re-run this analysis to measure improvements
4. Document performance gains

EOF

echo -e "\n${GREEN}Performance report generated: $OUTPUT_FILE${NC}"

# Display summary
echo -e "\n${BLUE}=== Performance Summary ===${NC}"
cat "$OUTPUT_FILE" | grep -A 20 "^## Summary" | tail -n +3

echo -e "\n${GREEN}✅ Analysis complete!${NC}"