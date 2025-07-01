#!/bin/bash

# Script to create labels needed for Dependabot auto-triage workflow

echo "Creating labels for Dependabot auto-triage..."

# Security label
gh label create "security" \
  --description "Security updates" \
  --color "B60205" || echo "Label 'security' already exists"

# Priority labels
gh label create "priority:low" \
  --description "Low priority update" \
  --color "C2E0C6" || echo "Label 'priority:low' already exists"

gh label create "priority:medium" \
  --description "Medium priority update" \
  --color "FEF2C0" || echo "Label 'priority:medium' already exists"

gh label create "priority:high" \
  --description "High priority update" \
  --color "F9D0C4" || echo "Label 'priority:high' already exists"

# Semver labels
gh label create "semver:patch" \
  --description "Patch version update (x.x.X)" \
  --color "0E8A16" || echo "Label 'semver:patch' already exists"

gh label create "semver:minor" \
  --description "Minor version update (x.X.x)" \
  --color "FBCA04" || echo "Label 'semver:minor' already exists"

gh label create "semver:major" \
  --description "Major version update (X.x.x)" \
  --color "D93F0B" || echo "Label 'semver:major' already exists"

# Breaking change label
gh label create "breaking-change" \
  --description "Contains breaking changes" \
  --color "E11D48" || echo "Label 'breaking-change' already exists"

echo "Done! All labels have been created."