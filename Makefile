.PHONY: help install build test clean all hooks release

BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Default target: show help information
help:
	@echo "📦 Xiaomi Speaker Action - Available Commands"
	@echo ""
	@echo "Development Commands:"
	@echo "  make install       - Install dependencies"
	@echo "  make dev           - Run in development mode"
	@echo "  make build         - Build production version"
	@echo ""
	@echo "Testing Commands:"
	@echo "  make test          - Run all tests"
	@echo "  make test-watch    - Run tests in watch mode"
	@echo "  make typecheck     - TypeScript type checking"
	@echo ""
	@echo "Code Quality:"
	@echo "  make format        - Format code"
	@echo "  make format-check  - Check code formatting"
	@echo "  make lint          - Lint code (format + types)"
	@echo ""
	@echo "Git Hooks:"
	@echo "  make hooks         - Install pre-commit hooks"
	@echo "  make hooks-update  - Update pre-commit hooks"
	@echo ""
	@echo "Cleanup Commands:"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make dist-clean    - Deep clean (including dependencies)"
	@echo ""
	@echo "Shortcuts:"
	@echo "  make all           - Full workflow (install + check + test + build)"
	@echo ""

# Install dependencies
install:
	@echo "📥 Installing dependencies..."
	bun install

# Development mode
dev:
	@echo "🚀 Running in development mode..."
	bun run dev

# Build
build:
	@echo "🔨 Building production version..."
	bun run build
	@echo "✅ Build complete: dist/index.js"

# Run tests
test:
	@echo "🧪 Running tests..."
	bun test

# Watch mode tests
test-watch:
	@echo "👀 Running tests in watch mode..."
	bun test --watch

# Type checking
typecheck:
	@echo "🔍 TypeScript type checking..."
	bun run typecheck

# Format code
format:
	@echo "✨ Formatting code..."
	bun run format

# Check code formatting
format-check:
	@echo "🔍 Checking code formatting..."
	bun run format:check

# Lint code (format + types)
lint: format-check typecheck
	@echo "✅ Code checks passed"

# Install pre-commit hooks
hooks:
	@echo "🪝 Installing pre-commit hooks..."
	@command -v pre-commit >/dev/null 2>&1 || { \
		echo "❌ pre-commit not installed"; \
		echo ""; \
		echo "Installation:"; \
		echo "  brew install pre-commit"; \
		echo "  or"; \
		echo "  pip install pre-commit"; \
		exit 1; \
	}
	pre-commit install
	pre-commit install --hook-type pre-push
	@echo "✅ Git hooks installed"
	@echo ""
	@echo "Checks will now run automatically:"
	@echo "  • Before commit: format code + type check"
	@echo "  • Before push: run tests + build check"

# Update pre-commit hooks
hooks-update:
	@echo "🔄 Updating pre-commit hooks..."
	pre-commit autoupdate
	@echo "✅ Hooks updated"

# Manually run all hooks
hooks-run:
	@echo "🪝 Running all pre-commit hooks..."
	pre-commit run --all-files

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	@echo "✅ Cleanup complete"

# Deep clean (including dependencies)
dist-clean: clean
	@echo "🧹 Deep cleaning..."
	rm -rf node_modules/
	rm -f bun.lockb
	@echo "✅ Deep cleanup complete"

# Full workflow
all: install lint test build
	@echo ""
	@echo "✅ All checks passed!"
	@echo ""
	@ls -lh dist/index.js

# CI workflow (for GitHub Actions)
ci: typecheck test build
	@echo "✅ CI checks passed"

# Pre-release checks
pre-release: all
	@echo ""
	@echo "🚀 Preparing for release..."
	@echo "📦 Checking dist files..."
	@test -f dist/index.js || (echo "❌ dist/index.js not found" && exit 1)
	@echo "✅ Ready to release!"
	@echo ""
	@echo "Next steps:"
	@echo "  make release v0.0.0"

release:  ## Create and push version tag (Usage: make release v1.0.0)
	@if [ -z "$(filter-out release,$(MAKECMDGOALS))" ]; then \
		echo "$(RED)Error: Version number required$(NC)"; \
		echo "$(YELLOW)Usage: make release v1.0.0$(NC)"; \
		exit 1; \
	fi
	@VERSION="$(filter-out release,$(MAKECMDGOALS))"; \
	if ! echo "$$VERSION" | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+$$'; then \
		echo "$(RED)Error: Invalid version format '$$VERSION'$(NC)"; \
		echo "$(YELLOW)Expected format: v1.0.0$(NC)"; \
		exit 1; \
	fi; \
	SEMVER=$${VERSION#v}; \
	CURRENT_VERSION=$$(grep -o '"version": "[^"]*"' package.json | cut -d'"' -f4); \
	if [ "$$CURRENT_VERSION" != "$$SEMVER" ]; then \
		echo "$(RED)Error: package.json version ($$CURRENT_VERSION) does not match tag version ($$SEMVER)$(NC)"; \
		echo "$(YELLOW)Please update package.json version to $$SEMVER first$(NC)"; \
		exit 1; \
	fi; \
	if [ -n "$$(git status --porcelain)" ]; then \
		echo "$(RED)Error: Working directory has uncommitted changes$(NC)"; \
		echo "$(YELLOW)Please commit or stash your changes before releasing$(NC)"; \
		exit 1; \
	fi; \
	echo "$(YELLOW)About to create and push tag $$VERSION$(NC)"; \
	printf "$(YELLOW)Continue? [y/N] $(NC)"; \
	read -r CONFIRM; \
	if [ "$$CONFIRM" != "y" ] && [ "$$CONFIRM" != "Y" ]; then \
		echo "$(YELLOW)Aborted$(NC)"; \
		exit 1; \
	fi; \
	if git config user.signingkey >/dev/null 2>&1 && command -v gpg >/dev/null 2>&1; then \
		echo "$(BLUE)Creating GPG signed tag $$VERSION...$(NC)"; \
		if git tag -s $$VERSION -m "Release $$VERSION" 2>/dev/null; then \
			echo "$(GREEN)✓ Signed tag $$VERSION created successfully (Verified ✓)$(NC)"; \
		else \
			echo "$(YELLOW)⚠ GPG signing failed, using regular tag...$(NC)"; \
			git tag -a $$VERSION -m "Release $$VERSION"; \
			echo "$(GREEN)✓ Tag $$VERSION created successfully$(NC)"; \
		fi \
	else \
		echo "$(BLUE)Creating tag $$VERSION...$(NC)"; \
		git tag -a $$VERSION -m "Release $$VERSION"; \
		echo "$(GREEN)✓ Tag $$VERSION created successfully$(NC)"; \
		echo "$(YELLOW)💡 Tip: Configure GPG key to show Verified badge on GitHub$(NC)"; \
	fi; \
	echo "$(BLUE)Pushing tag to remote repository...$(NC)"; \
	git push origin $$VERSION; \
	MAJOR_VERSION=$$(echo $$VERSION | cut -d. -f1); \
	echo "$(BLUE)Updating major version tag $$MAJOR_VERSION...$(NC)"; \
	git tag -fa $$MAJOR_VERSION -m "Update $$MAJOR_VERSION to $$VERSION"; \
	git push origin $$MAJOR_VERSION --force; \
	echo "$(GREEN)✓ Release $$VERSION completed$(NC)"; \
	echo "$(GREEN)✓ Major version tag $$MAJOR_VERSION updated$(NC)"

# Allow version number as target
v%:
	@:
