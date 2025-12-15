.PHONY: help install dev build test test-watch typecheck format format-check lint clean dist-clean all hooks

# 默认目标：显示帮助信息
help:
	@echo "📦 Xiaomi Speaker Action - 可用命令"
	@echo ""
	@echo "开发命令:"
	@echo "  make install       - 安装依赖"
	@echo "  make dev           - 开发模式运行"
	@echo "  make build         - 构建生产版本"
	@echo ""
	@echo "测试命令:"
	@echo "  make test          - 运行所有测试"
	@echo "  make test-watch    - 监听模式运行测试"
	@echo "  make typecheck     - TypeScript 类型检查"
	@echo ""
	@echo "代码质量:"
	@echo "  make format        - 格式化代码"
	@echo "  make format-check  - 检查代码格式"
	@echo "  make lint          - 代码检查（格式+类型）"
	@echo ""
	@echo "Git Hooks:"
	@echo "  make hooks         - 安装 pre-commit hooks"
	@echo "  make hooks-update  - 更新 pre-commit hooks"
	@echo ""
	@echo "清理命令:"
	@echo "  make clean         - 清理构建产物"
	@echo "  make dist-clean    - 深度清理（包括依赖）"
	@echo ""
	@echo "快捷命令:"
	@echo "  make all           - 完整流程（安装+检查+测试+构建）"
	@echo ""

# 安装依赖
install:
	@echo "📥 安装依赖..."
	bun install

# 开发模式
dev:
	@echo "🚀 开发模式运行..."
	bun run dev

# 构建
build:
	@echo "🔨 构建生产版本..."
	bun run build
	@echo "✅ 构建完成: dist/index.js"

# 运行测试
test:
	@echo "🧪 运行测试..."
	bun test

# 监听模式测试
test-watch:
	@echo "👀 监听模式运行测试..."
	bun test --watch

# 类型检查
typecheck:
	@echo "🔍 TypeScript 类型检查..."
	bun run typecheck

# 格式化代码
format:
	@echo "✨ 格式化代码..."
	bun run format

# 检查代码格式
format-check:
	@echo "🔍 检查代码格式..."
	bun run format:check

# 代码检查（格式+类型）
lint: format-check typecheck
	@echo "✅ 代码检查通过"

# 安装 pre-commit hooks
hooks:
	@echo "🪝 安装 pre-commit hooks..."
	@command -v pre-commit >/dev/null 2>&1 || { \
		echo "❌ pre-commit 未安装"; \
		echo ""; \
		echo "安装方法:"; \
		echo "  brew install pre-commit"; \
		echo "  或"; \
		echo "  pip install pre-commit"; \
		exit 1; \
	}
	pre-commit install
	pre-commit install --hook-type pre-push
	@echo "✅ Git hooks 安装完成"
	@echo ""
	@echo "现在会在以下时机自动运行检查:"
	@echo "  • commit 前: 格式化代码 + 类型检查"
	@echo "  • push 前: 运行测试 + 构建检查"

# 更新 pre-commit hooks
hooks-update:
	@echo "🔄 更新 pre-commit hooks..."
	pre-commit autoupdate
	@echo "✅ Hooks 更新完成"

# 手动运行所有 hooks
hooks-run:
	@echo "🪝 运行所有 pre-commit hooks..."
	pre-commit run --all-files

# 清理构建产物
clean:
	@echo "🧹 清理构建产物..."
	rm -rf dist/
	@echo "✅ 清理完成"

# 深度清理（包括依赖）
dist-clean: clean
	@echo "🧹 深度清理..."
	rm -rf node_modules/
	rm -f bun.lockb
	@echo "✅ 深度清理完成"

# 完整流程
all: install lint test build
	@echo ""
	@echo "✅ 所有检查通过！"
	@echo ""
	@ls -lh dist/index.js

# CI 流程（用于 GitHub Actions）
ci: typecheck test build
	@echo "✅ CI 检查通过"

# 发布前检查
pre-release: all
	@echo ""
	@echo "🚀 准备发布..."
	@echo "📦 检查 dist 文件..."
	@test -f dist/index.js || (echo "❌ dist/index.js 不存在" && exit 1)
	@echo "✅ 准备就绪，可以发布！"
	@echo ""
	@echo "下一步:"
	@echo "  git add ."
	@echo "  git commit -m 'chore: prepare release'"
	@echo "  git tag v1.0.0"
	@echo "  git push origin main --tags"
