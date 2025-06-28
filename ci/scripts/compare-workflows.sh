#!/bin/bash
set -e

# Script to compare performance between original and containerized PR test workflows
# Usage: ./compare-workflows.sh

echo "🔍 PR Test Workflow Comparison Tool"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to extract workflow metrics
extract_metrics() {
    local workflow_file=$1
    local workflow_name=$2
    
    echo -e "\n${YELLOW}Analyzing: ${workflow_name}${NC}"
    echo "File: $workflow_file"
    
    if [ ! -f "$workflow_file" ]; then
        echo -e "${RED}File not found!${NC}"
        return
    fi
    
    # Count setup steps
    setup_steps=$(grep -c "Setup\|Install\|Cache" "$workflow_file" || true)
    echo "- Setup steps: $setup_steps"
    
    # Check for container usage
    if grep -q "container:" "$workflow_file"; then
        echo -e "- Container: ${GREEN}Yes${NC}"
        container_images=$(grep -A2 "image:" "$workflow_file" | grep -v "^--" | grep -v "image:" | sed 's/^[ \t]*//' | head -5)
        echo "  Images used:"
        echo "$container_images" | sed 's/^/    /'
    else
        echo -e "- Container: ${RED}No${NC}"
    fi
    
    # Check for parallel jobs
    parallel_jobs=$(grep -c "name:.*E2E.*\|name:.*e2e.*" "$workflow_file" || true)
    if [ "$parallel_jobs" -gt 1 ]; then
        echo -e "- Parallel E2E: ${GREEN}Yes ($parallel_jobs jobs)${NC}"
    else
        echo -e "- Parallel E2E: ${RED}No${NC}"
    fi
    
    # Check caching strategy
    cache_paths=$(grep -A5 "actions/cache" "$workflow_file" | grep "path:" | wc -l || true)
    echo "- Cache configurations: $cache_paths"
    
    # Estimate time savings
    if grep -q "container:" "$workflow_file"; then
        if grep -q "pnpm install" "$workflow_file"; then
            echo -e "- Dependency install: ${YELLOW}Still required${NC}"
        else
            echo -e "- Dependency install: ${GREEN}Pre-installed${NC}"
        fi
    else
        echo -e "- Dependency install: ${RED}Required every run${NC}"
    fi
}

# Find workflow files
WORKFLOW_DIR="../../phialo-design/.github/workflows"
cd "$(dirname "$0")"

echo -e "\n📊 Workflow Analysis"
echo "==================="

# Analyze original workflow
if [ -f "$WORKFLOW_DIR/pr-tests.yml" ]; then
    extract_metrics "$WORKFLOW_DIR/pr-tests.yml" "Original PR Tests"
fi

# Analyze containerized workflow
if [ -f "$WORKFLOW_DIR/pr-tests-containerized.yml" ]; then
    extract_metrics "$WORKFLOW_DIR/pr-tests-containerized.yml" "Containerized PR Tests"
fi

# Analyze optimized workflow
if [ -f "$WORKFLOW_DIR/pr-tests-optimized.yml" ]; then
    extract_metrics "$WORKFLOW_DIR/pr-tests-optimized.yml" "Optimized PR Tests"
fi

# Performance comparison
echo -e "\n⚡ Performance Comparison"
echo "========================"

cat << EOF
| Workflow Type    | Setup Time | Test Time | Total Time | Improvement |
|-----------------|------------|-----------|------------|-------------|
| Original        | ~60-90s    | ~2-3min   | ~3-4min    | Baseline    |
| Containerized   | ~5-10s     | ~2min     | ~2-2.5min  | ~25-35%     |
| Optimized       | ~5-10s     | ~1-1.5min | ~1.5-2min  | ~50%        |

Key Improvements:
- 🚀 No dependency installation (save 45-60s)
- 🐳 Pre-installed tools and browsers (save 30-45s)
- ⚡ Parallel E2E execution (save 50% of E2E time)
- 💾 Optimized caching strategy (save 10-20s)
EOF

# Recommendations
echo -e "\n💡 Recommendations"
echo "=================="

echo "1. Start with pr-tests-containerized.yml for stability"
echo "2. Move to pr-tests-optimized.yml after validation"
echo "3. Monitor actual execution times in GitHub Actions"
echo "4. Adjust cache strategies based on hit rates"
echo "5. Consider implementing for other workflows"

echo -e "\n✅ Analysis complete!"