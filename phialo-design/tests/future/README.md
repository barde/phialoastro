# Future Tests

This directory contains test specifications for features that are planned but not yet implemented.

## Purpose

- **Preserve test specifications**: Keep test plans for future features
- **Document expected behavior**: Define how features should work when implemented
- **Track feature requests**: Link tests to GitHub issues for tracking

## Current Future Tests

### Dark Mode / Theme Toggle (`dark-mode.spec.ts`)
- **Issue**: #12
- **Description**: Tests for light/dark theme switching functionality
- **Status**: Waiting for feature implementation

## Usage

1. When a feature is planned, write the test specification here
2. Use `test.skip()` to prevent tests from running
3. Include detailed comments about expected behavior
4. Reference the GitHub issue for tracking
5. When the feature is implemented:
   - Move the test to the appropriate `e2e` directory
   - Remove the `skip` annotations
   - Update this README

## Guidelines

- Tests should be complete and ready to run once the feature exists
- Include all edge cases and scenarios
- Document any assumptions about the implementation
- Keep tests organized by feature area