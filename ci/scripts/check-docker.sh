#!/bin/bash
set -euo pipefail

# Check Docker installation and connectivity

echo "🔍 Checking Docker Setup"
echo "======================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "Please install Docker Desktop for Mac: https://docs.docker.com/desktop/install/mac-install/"
    exit 1
fi

echo "✅ Docker is installed"
echo "Docker version: $(docker --version)"
echo ""

# Check Docker daemon
echo "Checking Docker daemon..."
if docker info > /dev/null 2>&1; then
    echo "✅ Docker daemon is running"
    echo ""
    docker info | grep -E "Server Version:|Operating System:|Architecture:|CPUs:|Total Memory:"
else
    echo "❌ Docker daemon is not running or not accessible"
    echo ""
    echo "Possible solutions:"
    echo "1. Start Docker Desktop"
    echo "2. Check Docker Desktop settings"
    echo "3. Run: docker context ls"
    echo "4. Try: docker context use default"
    exit 1
fi

# Check Docker contexts
echo ""
echo "Docker contexts:"
docker context ls

echo ""
echo "Current context:"
docker context show

# Test simple container
echo ""
echo "Testing container execution..."
if docker run --rm hello-world > /dev/null 2>&1; then
    echo "✅ Docker can run containers"
else
    echo "❌ Docker cannot run containers"
    exit 1
fi

echo ""
echo "✅ Docker setup is working correctly!"