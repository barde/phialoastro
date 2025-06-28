#!/bin/bash
# Test CI/CD pipeline locally
# This script simulates the GitHub Actions workflow locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE_PREFIX="${IMAGE_PREFIX:-phialo}"
DRY_RUN="${DRY_RUN:-false}"

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check gh CLI (optional)
    if command -v gh &> /dev/null; then
        print_success "GitHub CLI found"
    else
        print_warning "GitHub CLI not found (optional)"
    fi
    
    print_success "Prerequisites check passed"
}

# Build images
build_images() {
    print_info "Building Docker images..."
    
    # Build base image
    print_info "Building base image..."
    if [[ "$DRY_RUN" == "false" ]]; then
        docker build \
            --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
            --build-arg VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "local") \
            --build-arg VERSION="local-test" \
            -t ${IMAGE_PREFIX}-ci-base:local \
            -f base/Dockerfile.base \
            base/
    else
        print_warning "DRY RUN: Would build base image"
    fi
    print_success "Base image built"
    
    # Build test image
    print_info "Building test image..."
    if [[ "$DRY_RUN" == "false" ]]; then
        docker build \
            --build-arg BASE_IMAGE=${IMAGE_PREFIX}-ci-base:local \
            --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
            --build-arg VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "local") \
            --build-arg VERSION="local-test" \
            -t ${IMAGE_PREFIX}-test:local \
            -f test/Dockerfile.ci \
            test/
    else
        print_warning "DRY RUN: Would build test image"
    fi
    print_success "Test image built"
    
    # Build deploy image
    print_info "Building deploy image..."
    if [[ "$DRY_RUN" == "false" ]]; then
        docker build \
            --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
            --build-arg VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "local") \
            --build-arg VERSION="local-test" \
            -t ${IMAGE_PREFIX}-build-deploy:local \
            -f build/Dockerfile \
            ../
    else
        print_warning "DRY RUN: Would build deploy image"
    fi
    print_success "Deploy image built"
}

# Test images
test_images() {
    print_info "Testing Docker images..."
    
    # Test base image
    print_info "Testing base image..."
    if [[ "$DRY_RUN" == "false" ]]; then
        docker run --rm ${IMAGE_PREFIX}-ci-base:local \
            sh -c "node --version && npm --version && pnpm --version"
    else
        print_warning "DRY RUN: Would test base image"
    fi
    print_success "Base image test passed"
    
    # Test test image
    print_info "Testing test image..."
    if [[ "$DRY_RUN" == "false" ]]; then
        docker run --rm ${IMAGE_PREFIX}-test:local \
            pnpm exec playwright --version
    else
        print_warning "DRY RUN: Would test test image"
    fi
    print_success "Test image test passed"
    
    # Test deploy image
    print_info "Testing deploy image..."
    if [[ "$DRY_RUN" == "false" ]]; then
        docker run --rm ${IMAGE_PREFIX}-build-deploy:local \
            wrangler --version
    else
        print_warning "DRY RUN: Would test deploy image"
    fi
    print_success "Deploy image test passed"
}

# Scan images for vulnerabilities
scan_images() {
    print_info "Scanning images for vulnerabilities..."
    
    # Check if trivy is installed
    if ! command -v trivy &> /dev/null; then
        print_warning "Trivy not installed, skipping security scan"
        print_warning "Install with: brew install aquasecurity/trivy/trivy"
        return
    fi
    
    for image in ci-base test build-deploy; do
        print_info "Scanning ${IMAGE_PREFIX}-${image}:local..."
        if [[ "$DRY_RUN" == "false" ]]; then
            trivy image --severity HIGH,CRITICAL ${IMAGE_PREFIX}-${image}:local || true
        else
            print_warning "DRY RUN: Would scan ${image} image"
        fi
    done
    
    print_success "Security scan completed"
}

# Tag images
tag_images() {
    print_info "Tagging images..."
    
    local TAG="${1:-test}"
    
    for image in ci-base test build-deploy; do
        if [[ "$DRY_RUN" == "false" ]]; then
            docker tag ${IMAGE_PREFIX}-${image}:local ${REGISTRY}/${IMAGE_PREFIX}-${image}:${TAG}
            print_success "Tagged ${IMAGE_PREFIX}-${image}:${TAG}"
        else
            print_warning "DRY RUN: Would tag ${IMAGE_PREFIX}-${image}:${TAG}"
        fi
    done
}

# Show image sizes
show_sizes() {
    print_info "Image sizes:"
    if [[ "$DRY_RUN" == "false" ]]; then
        docker images ${IMAGE_PREFIX}-* --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}"
    else
        print_warning "DRY RUN: Would show image sizes"
    fi
}

# Clean up
cleanup() {
    print_info "Cleaning up..."
    
    read -p "Remove test images? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$DRY_RUN" == "false" ]]; then
            docker rmi ${IMAGE_PREFIX}-ci-base:local || true
            docker rmi ${IMAGE_PREFIX}-test:local || true
            docker rmi ${IMAGE_PREFIX}-build-deploy:local || true
            print_success "Test images removed"
        else
            print_warning "DRY RUN: Would remove test images"
        fi
    fi
}

# Main function
main() {
    print_info "Starting CI/CD pipeline test"
    print_info "Registry: ${REGISTRY}"
    print_info "Image prefix: ${IMAGE_PREFIX}"
    print_info "Dry run: ${DRY_RUN}"
    echo
    
    # Check prerequisites
    check_prerequisites
    echo
    
    # Build images
    build_images
    echo
    
    # Test images
    test_images
    echo
    
    # Scan images
    scan_images
    echo
    
    # Show sizes
    show_sizes
    echo
    
    # Tag images (optional)
    read -p "Tag images for registry? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter tag (default: test): " TAG
        TAG="${TAG:-test}"
        tag_images "$TAG"
        echo
    fi
    
    print_success "CI/CD pipeline test completed!"
    echo
    
    # Cleanup (optional)
    cleanup
}

# Show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Test the CI/CD pipeline locally by building and testing all Docker images.

OPTIONS:
    -h, --help          Show this help message
    -d, --dry-run       Show what would be done without executing
    -r, --registry      Set registry (default: ghcr.io)
    -p, --prefix        Set image prefix (default: phialo)

EXAMPLES:
    # Run full test
    $0

    # Dry run to see what would happen
    $0 --dry-run

    # Use custom registry
    $0 --registry docker.io --prefix myproject

ENVIRONMENT VARIABLES:
    REGISTRY        Docker registry (default: ghcr.io)
    IMAGE_PREFIX    Image name prefix (default: phialo)
    DRY_RUN         Set to 'true' for dry run mode
EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -d|--dry-run)
            DRY_RUN="true"
            shift
            ;;
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -p|--prefix)
            IMAGE_PREFIX="$2"
            shift 2
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
main