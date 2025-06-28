#!/bin/bash

# Script to compare CI/CD performance before and after containerization

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BASELINE_FILE="${1:-performance-baselines/baseline_metrics_summary.json}"
OUTPUT_DIR="performance-comparisons"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to calculate percentage change
calc_percentage() {
    local old=$1
    local new=$2
    if [ "$old" -eq 0 ]; then
        echo "N/A"
    else
        local change=$(( (old - new) * 100 / old ))
        if [ $change -gt 0 ]; then
            echo "+${change}%"
        else
            echo "${change}%"
        fi
    fi
}

# Function to get current metrics
get_current_metrics() {
    local workflow=$1
    
    # Get recent runs
    local runs=$(gh run list --workflow="$workflow" --limit=5 --status=success --json databaseId,createdAt,updatedAt 2>/dev/null || echo "[]")
    
    if [ "$runs" != "[]" ] && [ -n "$runs" ]; then
        local total_duration=0
        local count=0
        
        while IFS= read -r run; do
            local created=$(echo "$run" | jq -r '.createdAt')
            local updated=$(echo "$run" | jq -r '.updatedAt')
            
            # Calculate duration (macOS compatible)
            local updated_ts=$(date -jf "%Y-%m-%dT%H:%M:%SZ" "$updated" +%s 2>/dev/null || echo 0)
            local created_ts=$(date -jf "%Y-%m-%dT%H:%M:%SZ" "$created" +%s 2>/dev/null || echo 0)
            
            if [ "$updated_ts" -ne 0 ] && [ "$created_ts" -ne 0 ]; then
                local duration=$((updated_ts - created_ts))
                total_duration=$((total_duration + duration))
                count=$((count + 1))
            fi
        done < <(echo "$runs" | jq -c '.[]')
        
        if [ $count -gt 0 ]; then
            echo $((total_duration / count))
        else
            echo 0
        fi
    else
        echo 0
    fi
}

# Main execution
print_color "$GREEN" "=== CI/CD Performance Comparison ==="
print_color "$GREEN" "Baseline: $BASELINE_FILE"
print_color "$GREEN" "Timestamp: $(date)"
echo ""

# Check if baseline file exists
if [ ! -f "$BASELINE_FILE" ]; then
    print_color "$RED" "Error: Baseline file not found: $BASELINE_FILE"
    exit 1
fi

# Read baseline metrics
baseline_pr_tests=$(jq -r '.workflows.pr_tests.average_duration_seconds' "$BASELINE_FILE")
baseline_nightly=$(jq -r '.workflows.nightly_tests.average_duration_seconds' "$BASELINE_FILE")
baseline_file_val=$(jq -r '.workflows.file_validation.average_duration_seconds' "$BASELINE_FILE")

# Get current metrics
print_color "$BLUE" "Collecting current performance metrics..."
current_pr_tests=$(get_current_metrics "pr-tests.yml")
current_nightly=$(get_current_metrics "nightly-tests.yml")
current_file_val=$(get_current_metrics "file-validation.yml")

# Create comparison report
cat > "$OUTPUT_DIR/comparison_${TIMESTAMP}.md" << EOF
# Performance Comparison Report

**Generated:** $(date)

## Workflow Performance Comparison

| Workflow | Baseline | Current | Change | Status |
|----------|----------|---------|--------|--------|
EOF

# Function to add comparison row
add_comparison_row() {
    local name=$1
    local baseline=$2
    local current=$3
    
    if [ "$current" -eq 0 ]; then
        echo "| $name | ${baseline}s | N/A | N/A | ⚠️ No data |" >> "$OUTPUT_DIR/comparison_${TIMESTAMP}.md"
    else
        local change=$(calc_percentage "$baseline" "$current")
        local status="✅"
        if [ "$current" -gt "$baseline" ]; then
            status="❌"
        fi
        echo "| $name | ${baseline}s | ${current}s | $change | $status |" >> "$OUTPUT_DIR/comparison_${TIMESTAMP}.md"
    fi
}

# Add comparison rows
add_comparison_row "PR Tests" "$baseline_pr_tests" "$current_pr_tests"
add_comparison_row "Nightly Tests" "$baseline_nightly" "$current_nightly"
add_comparison_row "File Validation" "$baseline_file_val" "$current_file_val"

# Add detailed analysis
cat >> "$OUTPUT_DIR/comparison_${TIMESTAMP}.md" << EOF

## Detailed Analysis

### PR Tests Workflow
EOF

if [ "$current_pr_tests" -ne 0 ]; then
    improvement=$((baseline_pr_tests - current_pr_tests))
    if [ $improvement -gt 0 ]; then
        echo "- **Time Saved:** ${improvement} seconds per run" >> "$OUTPUT_DIR/comparison_${TIMESTAMP}.md"
        echo "- **Monthly Savings:** ~$((improvement * 1000 / 60)) minutes" >> "$OUTPUT_DIR/comparison_${TIMESTAMP}.md"
    else
        echo "- **Performance Degradation:** ${improvement#-} seconds per run" >> "$OUTPUT_DIR/comparison_${TIMESTAMP}.md"
    fi
fi

# Check against targets
cat >> "$OUTPUT_DIR/comparison_${TIMESTAMP}.md" << EOF

### Target Achievement

| Metric | Target | Achieved | Status |
|--------|--------|----------|--------|
EOF

# Read targets from baseline
target_pr=$(jq -r '.optimization_targets.pr_test_total.target_seconds' "$BASELINE_FILE")

if [ "$current_pr_tests" -ne 0 ]; then
    if [ "$current_pr_tests" -le "$target_pr" ]; then
        echo "| PR Test Total | ${target_pr}s | ${current_pr_tests}s | ✅ Met |" >> "$OUTPUT_DIR/comparison_${TIMESTAMP}.md"
    else
        echo "| PR Test Total | ${target_pr}s | ${current_pr_tests}s | ❌ Not Met |" >> "$OUTPUT_DIR/comparison_${TIMESTAMP}.md"
    fi
fi

# Add recommendations
cat >> "$OUTPUT_DIR/comparison_${TIMESTAMP}.md" << EOF

## Recommendations

Based on the comparison:

EOF

if [ "$current_pr_tests" -ne 0 ] && [ "$current_pr_tests" -lt "$baseline_pr_tests" ]; then
    echo "1. ✅ Containerization has improved PR test performance" >> "$OUTPUT_DIR/comparison_${TIMESTAMP}.md"
    echo "2. Continue monitoring for consistency" >> "$OUTPUT_DIR/comparison_${TIMESTAMP}.md"
else
    echo "1. ⚠️ Performance improvements not yet realized" >> "$OUTPUT_DIR/comparison_${TIMESTAMP}.md"
    echo "2. Review container implementation for optimization opportunities" >> "$OUTPUT_DIR/comparison_${TIMESTAMP}.md"
fi

# Display summary
print_color "$GREEN" "\n✓ Comparison report generated: $OUTPUT_DIR/comparison_${TIMESTAMP}.md"

# Show quick summary in terminal
echo ""
print_color "$YELLOW" "Quick Summary:"
echo "PR Tests: ${baseline_pr_tests}s → ${current_pr_tests}s"
echo "Nightly: ${baseline_nightly}s → ${current_nightly}s"
echo "File Val: ${baseline_file_val}s → ${current_file_val}s"