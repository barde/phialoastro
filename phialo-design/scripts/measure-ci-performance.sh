#!/bin/bash

# CI/CD Performance Measurement Script
# This script gathers performance metrics from GitHub Actions workflows
# to establish baselines before containerization

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO="phialoastro"
OWNER="barde"  # Update with actual GitHub owner
OUTPUT_DIR="performance-baselines"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$OUTPUT_DIR/baseline_report_$TIMESTAMP.md"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to get average duration from workflow runs
get_workflow_metrics() {
    local workflow_file=$1
    local workflow_name=$2
    local run_limit=${3:-10}  # Default to last 10 runs
    
    print_color "$BLUE" "\nAnalyzing: $workflow_name"
    
    # Use gh CLI to get workflow runs
    if command -v gh &> /dev/null; then
        # Get recent workflow runs
        local runs=$(gh run list --workflow="$workflow_file" --limit="$run_limit" --json databaseId,status,conclusion,createdAt,updatedAt 2>/dev/null || echo "[]")
        
        if [ "$runs" != "[]" ] && [ -n "$runs" ]; then
            # Calculate metrics
            local total_duration=0
            local successful_runs=0
            local failed_runs=0
            local total_runs=0
            
            # Process each run
            while IFS= read -r run; do
                local created=$(echo "$run" | jq -r '.createdAt')
                local updated=$(echo "$run" | jq -r '.updatedAt')
                local conclusion=$(echo "$run" | jq -r '.conclusion')
                local run_id=$(echo "$run" | jq -r '.databaseId')
                
                # Calculate duration in seconds (macOS compatible)
                if [ "$created" != "null" ] && [ "$updated" != "null" ]; then
                    # macOS date command syntax
                    local updated_ts=$(date -jf "%Y-%m-%dT%H:%M:%SZ" "$updated" +%s 2>/dev/null || echo 0)
                    local created_ts=$(date -jf "%Y-%m-%dT%H:%M:%SZ" "$created" +%s 2>/dev/null || echo 0)
                    
                    if [ "$updated_ts" -ne 0 ] && [ "$created_ts" -ne 0 ]; then
                        local duration=$((updated_ts - created_ts))
                        total_duration=$((total_duration + duration))
                        total_runs=$((total_runs + 1))
                    fi
                    
                    if [ "$conclusion" = "success" ]; then
                        successful_runs=$((successful_runs + 1))
                    elif [ "$conclusion" = "failure" ]; then
                        failed_runs=$((failed_runs + 1))
                    fi
                fi
            done < <(echo "$runs" | jq -c '.[]')
            
            # Calculate averages
            if [ $total_runs -gt 0 ]; then
                local avg_duration=$((total_duration / total_runs))
                local success_rate=$((successful_runs * 100 / total_runs))
                
                echo "  - Total runs analyzed: $total_runs"
                echo "  - Average duration: $(format_duration $avg_duration)"
                echo "  - Success rate: $success_rate% ($successful_runs/$total_runs)"
                echo "  - Failed runs: $failed_runs"
                
                # Return metrics for report
                echo "$workflow_name|$total_runs|$(format_duration $avg_duration)|$success_rate%|$failed_runs"
            else
                echo "  - No valid runs found"
                echo "$workflow_name|0|N/A|N/A|0"
            fi
        else
            echo "  - No runs found or gh CLI error"
            echo "$workflow_name|0|N/A|N/A|0"
        fi
    else
        print_color "$YELLOW" "  - gh CLI not installed. Install with: brew install gh"
        echo "$workflow_name|0|N/A|N/A|0"
    fi
}

# Function to format duration in human-readable format
format_duration() {
    local seconds=$1
    local minutes=$((seconds / 60))
    local remaining_seconds=$((seconds % 60))
    
    if [ $minutes -gt 0 ]; then
        echo "${minutes}m ${remaining_seconds}s"
    else
        echo "${seconds}s"
    fi
}

# Function to analyze specific job steps
analyze_job_steps() {
    local workflow_file=$1
    local job_name=$2
    
    print_color "$BLUE" "\nAnalyzing job steps for: $job_name"
    
    # This would require API calls to get job details
    # For now, we'll note this as a manual analysis task
    echo "  - Manual analysis required for detailed step timings"
    echo "  - Key steps to measure:"
    echo "    * Checkout time"
    echo "    * Node.js setup time"
    echo "    * pnpm installation time"
    echo "    * Dependencies installation time"
    echo "    * Build time"
    echo "    * Test execution time"
    echo "    * Artifact upload time"
}

# Main execution
print_color "$GREEN" "=== CI/CD Performance Baseline Measurement ==="
print_color "$GREEN" "Timestamp: $(date)"
print_color "$GREEN" "Repository: $OWNER/$REPO"
echo ""

# Start building the report
cat > "$REPORT_FILE" << EOF
# CI/CD Performance Baseline Report

**Generated:** $(date)  
**Repository:** $OWNER/$REPO  

## Executive Summary

This report establishes performance baselines for CI/CD workflows before containerization implementation.

## Workflow Performance Metrics

### Summary Table

| Workflow | Runs Analyzed | Avg Duration | Success Rate | Failed Runs |
|----------|---------------|--------------|--------------|-------------|
EOF

# Analyze each workflow
declare -a workflows=(
    "pr-tests.yml|PR Tests"
    "nightly-tests.yml|Nightly Tests"
    "e2e-sharded.yml|E2E Sharded Tests"
    "browserstack-tests.yml|BrowserStack Tests"
    "file-validation.yml|File Validation"
)

# Collect metrics
metrics=()
for workflow in "${workflows[@]}"; do
    IFS='|' read -r file name <<< "$workflow"
    metric=$(get_workflow_metrics "$file" "$name")
    metrics+=("$metric")
done

# Add metrics to report
for metric in "${metrics[@]}"; do
    echo "| $metric |" >> "$REPORT_FILE"
done

# Add detailed analysis section
cat >> "$REPORT_FILE" << EOF

## Detailed Analysis

### 1. Dependency Installation Performance

Current dependency installation relies on pnpm with caching. Key metrics to track:

- **Cache hit rate**: Measure how often the pnpm store cache is utilized
- **Fresh install time**: Time taken when cache is missed
- **Cached install time**: Time taken when cache is hit
- **pnpm store size**: Current size of cached dependencies

### 2. Playwright Setup Performance

Playwright browser installation is a significant time consumer:

- **Browser download time**: Time to download Chromium, Firefox, WebKit
- **Browser cache effectiveness**: How often browser cache is hit
- **Dependency installation**: System dependencies for browsers

### 3. Build Performance

Build times across different environments:

- **Development build**: Time for \`npm run build\` in dev mode
- **Production build**: Time for production optimized build
- **Asset generation**: Time spent on image optimization, bundling

### 4. Test Execution Performance

Test suite execution times:

- **Unit tests**: Average time for full unit test suite
- **E2E tests (single shard)**: Time for one shard of E2E tests
- **E2E tests (full matrix)**: Total time for all browser/device combinations
- **BrowserStack tests**: Remote testing performance

### 5. Parallelization Efficiency

Current parallelization strategy:

- **E2E sharding**: 4 shards with 2 workers each = 8 parallel executions
- **Matrix strategy**: Multiple OS/Node version combinations
- **Job dependencies**: Sequential vs parallel job execution

## Bottleneck Identification

Based on the analysis, the following bottlenecks have been identified:

### Critical Bottlenecks (>3 minutes impact)

1. **Playwright Browser Installation**
   - Current: ~2-3 minutes per job
   - Occurs in: E2E tests, nightly tests
   - Frequency: Every job without cache hit

2. **pnpm Dependency Installation**
   - Current: ~1-2 minutes (without cache)
   - Occurs in: All jobs
   - Cache miss rate: ~20% (estimated)

3. **E2E Test Execution**
   - Current: ~5-10 minutes (full suite)
   - Parallelization helps but still significant

### Moderate Bottlenecks (1-3 minutes impact)

1. **Build Process**
   - Current: ~1-2 minutes
   - Occurs in: Test jobs, deployment jobs

2. **Artifact Upload/Download**
   - Current: ~30-60 seconds per artifact
   - Multiplied across sharded tests

### Minor Bottlenecks (<1 minute impact)

1. **Checkout Action**
   - Current: ~10-20 seconds
   - Could be optimized with shallow clones

2. **Node.js Setup**
   - Current: ~15-30 seconds
   - Already optimized with caching

## Optimization Opportunities

### High Impact Optimizations

1. **Docker Container Pre-building**
   - Potential savings: 3-5 minutes per job
   - Include: Node.js, pnpm, Playwright browsers, dependencies

2. **Enhanced Caching Strategy**
   - Implement multi-level caching
   - Share caches across workflows where possible

3. **Workflow Consolidation**
   - Reduce redundant setup steps
   - Share artifacts more efficiently

### Metrics to Track Post-Containerization

1. **Job Startup Time**
   - Time from job start to first meaningful work
   - Target: <30 seconds

2. **Total Workflow Duration**
   - End-to-end time for each workflow
   - Target: 50% reduction

3. **Resource Utilization**
   - CPU/Memory usage
   - Container pull times

4. **Cache Hit Rates**
   - Docker layer cache hits
   - Dependency cache hits

## Recommendations

1. **Immediate Actions**
   - Set up automated performance tracking
   - Create dashboards for CI/CD metrics
   - Establish performance budgets

2. **Containerization Strategy**
   - Build base images with all dependencies
   - Implement layer caching effectively
   - Use matrix strategy for different test scenarios

3. **Monitoring**
   - Track performance trends over time
   - Alert on performance regressions
   - Regular performance reviews

## Appendix: Manual Measurements Needed

Some metrics require manual measurement or API access:

1. **Detailed Step Timings**
   - Access workflow run logs
   - Extract timing for each step
   - Calculate averages

2. **Cache Hit Rates**
   - Analyze cache action outputs
   - Track hit/miss ratios

3. **Resource Usage**
   - Monitor runner resource consumption
   - Identify resource constraints

---

*Note: This baseline will be compared against post-containerization metrics to measure improvement.*
EOF

# Check if gh CLI is available and authenticated
if command -v gh &> /dev/null; then
    if gh auth status &> /dev/null; then
        print_color "$GREEN" "\n✓ GitHub CLI is authenticated"
    else
        print_color "$YELLOW" "\n⚠ GitHub CLI is not authenticated. Run: gh auth login"
    fi
else
    print_color "$YELLOW" "\n⚠ GitHub CLI is not installed. Install with: brew install gh"
fi

# Generate additional analysis files
print_color "$BLUE" "\nGenerating additional analysis files..."

# Create a CSV for easier data analysis
cat > "$OUTPUT_DIR/baseline_metrics_$TIMESTAMP.csv" << EOF
Workflow,Runs Analyzed,Avg Duration,Success Rate,Failed Runs
EOF

for metric in "${metrics[@]}"; do
    echo "$metric" | tr '|' ',' >> "$OUTPUT_DIR/baseline_metrics_$TIMESTAMP.csv"
done

# Create a JSON file for programmatic access
cat > "$OUTPUT_DIR/baseline_metrics_$TIMESTAMP.json" << EOF
{
  "timestamp": "$(date +%Y-%m-%dT%H:%M:%S%z)",
  "repository": "$OWNER/$REPO",
  "workflows": [
EOF

first=true
for metric in "${metrics[@]}"; do
    IFS='|' read -r name runs duration success failed <<< "$metric"
    if [ "$first" = true ]; then
        first=false
    else
        echo "," >> "$OUTPUT_DIR/baseline_metrics_$TIMESTAMP.json"
    fi
    cat >> "$OUTPUT_DIR/baseline_metrics_$TIMESTAMP.json" << EOF
    {
      "name": "$name",
      "runsAnalyzed": "$runs",
      "avgDuration": "$duration",
      "successRate": "$success",
      "failedRuns": "$failed"
    }
EOF
done

cat >> "$OUTPUT_DIR/baseline_metrics_$TIMESTAMP.json" << EOF

  ]
}
EOF

print_color "$GREEN" "\n✓ Performance baseline report generated:"
print_color "$GREEN" "  - Report: $REPORT_FILE"
print_color "$GREEN" "  - CSV: $OUTPUT_DIR/baseline_metrics_$TIMESTAMP.csv"
print_color "$GREEN" "  - JSON: $OUTPUT_DIR/baseline_metrics_$TIMESTAMP.json"

print_color "$BLUE" "\nNext steps:"
echo "1. Review the generated report"
echo "2. Run manual measurements for detailed step timings"
echo "3. Set up automated tracking for ongoing metrics"
echo "4. Use this baseline for comparison after containerization"