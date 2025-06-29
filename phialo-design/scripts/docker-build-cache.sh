#!/bin/bash

# Docker Build Cache Management Script
# This script helps manage Docker build caches for optimal CI/CD performance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="phialo-design"
CACHE_DIR="/tmp/docker-cache-${PROJECT_NAME}"
REGISTRY_CACHE="registry.local:5000/${PROJECT_NAME}"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if BuildKit is enabled
check_buildkit() {
    if [ "$DOCKER_BUILDKIT" != "1" ]; then
        print_warning "BuildKit is not enabled. Enabling it for this session..."
        export DOCKER_BUILDKIT=1
    fi
    print_success "BuildKit is enabled"
}

# Function to create cache directory
setup_cache_dir() {
    if [ ! -d "$CACHE_DIR" ]; then
        print_status "Creating cache directory: $CACHE_DIR"
        mkdir -p "$CACHE_DIR"
    fi
    print_success "Cache directory ready: $CACHE_DIR"
}

# Function to build with cache
build_with_cache() {
    local dockerfile=$1
    local target=$2
    local tag="${PROJECT_NAME}:${target}"
    
    print_status "Building ${tag} with cache..."
    
    docker buildx build \
        --file "$dockerfile" \
        --target "$target" \
        --tag "$tag" \
        --cache-from "type=local,src=${CACHE_DIR}" \
        --cache-to "type=local,dest=${CACHE_DIR},mode=max" \
        --progress=plain \
        .
    
    print_success "Built ${tag}"
}

# Function to warm up all caches
warm_caches() {
    print_status "Warming up Docker build caches..."
    
    # Build base dependencies
    build_with_cache "Dockerfile.ci" "base-deps"
    
    # Build CI stages
    build_with_cache "Dockerfile.ci" "deps"
    build_with_cache "Dockerfile.ci" "build-prep"
    build_with_cache "Dockerfile.ci" "ci"
    
    # Build production stages
    build_with_cache "Dockerfile" "deps"
    build_with_cache "Dockerfile" "builder"
    
    # Build dev stages
    build_with_cache "Dockerfile.dev" "dev-base"
    build_with_cache "Dockerfile.dev" "dev"
    
    print_success "All caches warmed up!"
}

# Function to export cache for CI
export_cache() {
    local output_file="${1:-docker-cache.tar.gz}"
    
    print_status "Exporting cache to ${output_file}..."
    
    if [ -d "$CACHE_DIR" ]; then
        tar -czf "$output_file" -C "$CACHE_DIR" .
        print_success "Cache exported to ${output_file} ($(du -h "$output_file" | cut -f1))"
    else
        print_error "Cache directory not found"
        exit 1
    fi
}

# Function to import cache
import_cache() {
    local input_file="${1:-docker-cache.tar.gz}"
    
    print_status "Importing cache from ${input_file}..."
    
    if [ -f "$input_file" ]; then
        mkdir -p "$CACHE_DIR"
        tar -xzf "$input_file" -C "$CACHE_DIR"
        print_success "Cache imported from ${input_file}"
    else
        print_error "Cache file not found: ${input_file}"
        exit 1
    fi
}

# Function to show cache statistics
show_stats() {
    print_status "Docker Cache Statistics"
    echo "========================="
    
    # Show BuildKit cache
    echo -e "\n${BLUE}BuildKit Cache:${NC}"
    docker buildx du
    
    # Show local cache directory size
    if [ -d "$CACHE_DIR" ]; then
        echo -e "\n${BLUE}Local Cache Directory:${NC}"
        du -sh "$CACHE_DIR"
        echo "Files: $(find "$CACHE_DIR" -type f | wc -l)"
    fi
    
    # Show image sizes
    echo -e "\n${BLUE}Built Images:${NC}"
    docker images | grep "$PROJECT_NAME" || echo "No project images found"
    
    # Show system df
    echo -e "\n${BLUE}Docker System:${NC}"
    docker system df
}

# Function to clean caches
clean_cache() {
    print_warning "Cleaning Docker caches..."
    
    # Clean BuildKit cache
    docker buildx prune -f
    
    # Clean local cache directory
    if [ -d "$CACHE_DIR" ]; then
        rm -rf "$CACHE_DIR"
        print_success "Removed local cache directory"
    fi
    
    # Optional: Clean all Docker caches
    if [ "$1" == "--all" ]; then
        print_warning "Cleaning all Docker caches..."
        docker system prune -af --volumes
    fi
    
    print_success "Cache cleaned"
}

# Function to push cache to registry
push_cache() {
    print_status "Pushing cache to registry..."
    
    # Build and push cache images
    for stage in "base-deps" "deps" "ci"; do
        docker buildx build \
            --file "Dockerfile.ci" \
            --target "$stage" \
            --tag "${REGISTRY_CACHE}:${stage}" \
            --cache-to "type=registry,ref=${REGISTRY_CACHE}:${stage},mode=max" \
            --push \
            .
    done
    
    print_success "Cache pushed to registry"
}

# Function to setup GitHub Actions cache
setup_github_cache() {
    print_status "Setting up GitHub Actions cache configuration..."
    
    cat > .github/docker-cache-config.yml << EOF
# Docker cache configuration for GitHub Actions
cache:
  # Local cache for single job
  local:
    path: /tmp/.buildx-cache
    key: \${{ runner.os }}-buildx-\${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      \${{ runner.os }}-buildx-
  
  # Registry cache for sharing across jobs
  registry:
    image: ghcr.io/\${{ github.repository }}/cache
    mode: max
  
  # S3 cache for persistent storage
  s3:
    bucket: docker-cache
    region: us-east-1
    key: buildx-\${{ github.sha }}
EOF
    
    print_success "Created GitHub Actions cache configuration"
}

# Main menu
show_menu() {
    echo -e "\n${BLUE}Docker Build Cache Manager${NC}"
    echo "=========================="
    echo "1. Check BuildKit status"
    echo "2. Warm up all caches"
    echo "3. Show cache statistics"
    echo "4. Export cache to file"
    echo "5. Import cache from file"
    echo "6. Clean caches"
    echo "7. Push cache to registry"
    echo "8. Setup GitHub Actions cache"
    echo "9. Exit"
    echo
}

# Main script logic
main() {
    # Ensure BuildKit is available
    check_buildkit
    setup_cache_dir
    
    # If command line arguments provided, execute directly
    if [ $# -gt 0 ]; then
        case "$1" in
            warm|warmup)
                warm_caches
                ;;
            stats|status)
                show_stats
                ;;
            export)
                export_cache "${2:-docker-cache.tar.gz}"
                ;;
            import)
                import_cache "${2:-docker-cache.tar.gz}"
                ;;
            clean)
                clean_cache "$2"
                ;;
            push)
                push_cache
                ;;
            github)
                setup_github_cache
                ;;
            *)
                print_error "Unknown command: $1"
                echo "Usage: $0 [warm|stats|export|import|clean|push|github]"
                exit 1
                ;;
        esac
    else
        # Interactive menu
        while true; do
            show_menu
            read -p "Select an option: " choice
            
            case $choice in
                1) check_buildkit ;;
                2) warm_caches ;;
                3) show_stats ;;
                4) 
                    read -p "Output file [docker-cache.tar.gz]: " output
                    export_cache "${output:-docker-cache.tar.gz}"
                    ;;
                5)
                    read -p "Input file [docker-cache.tar.gz]: " input
                    import_cache "${input:-docker-cache.tar.gz}"
                    ;;
                6)
                    read -p "Clean all caches? [y/N]: " confirm
                    if [ "$confirm" == "y" ]; then
                        clean_cache --all
                    else
                        clean_cache
                    fi
                    ;;
                7) push_cache ;;
                8) setup_github_cache ;;
                9) 
                    print_success "Goodbye!"
                    exit 0
                    ;;
                *) print_error "Invalid option" ;;
            esac
            
            echo
            read -p "Press Enter to continue..."
        done
    fi
}

# Run main function
main "$@"