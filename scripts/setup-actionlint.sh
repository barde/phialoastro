#!/bin/bash
# Setup actionlint for GitHub Actions workflow linting

set -e

echo "🔧 Setting up actionlint..."

# Create tools directory if it doesn't exist
mkdir -p .tools

# Download actionlint
cd .tools

if [ -f actionlint ]; then
    echo "✅ actionlint already installed"
    ./actionlint --version
else
    echo "📥 Downloading actionlint..."
    bash <(curl -s https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)
    echo "✅ actionlint installed successfully"
fi

cd ..

# Run initial lint check
echo ""
echo "🔍 Running initial lint check on GitHub Actions workflows..."
echo ""

if .tools/actionlint; then
    echo ""
    echo "✅ All workflows passed linting!"
else
    echo ""
    echo "⚠️  Some workflows have issues. Please fix them before committing."
fi

echo ""
echo "📌 To lint workflows manually, run: .tools/actionlint"
echo "📌 Workflows will be automatically linted on pre-commit and pre-push"