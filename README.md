# Xiaomi Speaker GitHub Action

[![GitHub Action](https://img.shields.io/badge/GitHub-Action-blue?logo=github-actions)](https://github.com/palemoky/xiaomi-speaker-action)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0-orange?logo=bun)](https://bun.sh/)

Send voice notifications via Xiaomi Speaker from your GitHub Actions workflows. Perfect for CI/CD alerts, deployment notifications, and build status updates.

## ✨ Features

- 🎯 **Smart Message Routing** - Different messages for success/failure scenarios
- 🔄 **Auto Retry** - Exponential backoff retry mechanism (configurable)
- 🔐 **Secure** - Optional API key authentication
- 📦 **Lightweight** - Zero runtime dependencies
- 🎨 **Flexible** - Customizable metadata and payload
- ⚡ **Fast** - Built with TypeScript + Bun

## 🚀 Quick Start

```yaml
name: Build and Notify

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: npm run build

      - name: Notify via Xiaomi Speaker
        if: always()
        uses: palemoky/xiaomi-speaker-action@v1
        with:
          webhook_url: ${{ secrets.XIAOMI_WEBHOOK_URL }}
          api_secret: ${{ secrets.XIAOMI_API_SECRET }}
          success_message: '✅ Build succeeded for ${{ github.repository }}'
          failure_message: '❌ Build failed for ${{ github.repository }}'
```

## 📋 Inputs

| Input             | Required | Default             | Description                       |
| ----------------- | -------- | ------------------- | --------------------------------- |
| `webhook_url`     | ✅       | -                   | Xiaomi Speaker webhook URL        |
| `api_secret`      | ❌       | -                   | API secret for authentication     |
| `message`         | ❌       | -                   | Default message (fallback)        |
| `success_message` | ❌       | -                   | Message for successful jobs       |
| `failure_message` | ❌       | -                   | Message for failed/cancelled jobs |
| `job_status`      | ❌       | `${{ job.status }}` | Job status (auto-detected)        |
| `custom_payload`  | ❌       | -                   | Custom JSON payload               |
| `timeout`         | ❌       | `10000`             | Request timeout (ms)              |
| `max_retries`     | ❌       | `2`                 | Maximum retry attempts            |
| `include_owner`   | ❌       | `false`             | Include repo owner in metadata    |

## 📤 Outputs

| Output         | Description                            |
| -------------- | -------------------------------------- |
| `status`       | Request status (`success` or `failed`) |
| `response`     | API response body (JSON string)        |
| `message_sent` | The actual message that was sent       |

## 📖 Usage Examples

### Basic: Success/Failure Messages

```yaml
- name: Notify
  if: always()
  uses: palemoky/xiaomi-speaker-action@v1
  with:
    webhook_url: ${{ secrets.XIAOMI_WEBHOOK_URL }}
    success_message: '部署成功'
    failure_message: '部署失败，请检查'
```

### Only Notify on Failure

```yaml
- name: Notify on Failure
  if: failure()
  uses: palemoky/xiaomi-speaker-action@v1
  with:
    webhook_url: ${{ secrets.XIAOMI_WEBHOOK_URL }}
    message: '构建失败：${{ github.repository }}'
```

### With Custom Payload

```yaml
- name: Notify with Metadata
  uses: palemoky/xiaomi-speaker-action@v1
  with:
    webhook_url: ${{ secrets.XIAOMI_WEBHOOK_URL }}
    message: '部署完成'
    custom_payload: |
      {
        "environment": "production",
        "version": "${{ github.ref_name }}",
        "deployed_by": "${{ github.actor }}"
      }
```

### Multiple Notification Points

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run Tests
        run: npm test

      - name: Notify Test Result
        if: always()
        uses: palemoky/xiaomi-speaker-action@v1
        with:
          webhook_url: ${{ secrets.XIAOMI_WEBHOOK_URL }}
          success_message: '测试通过'
          failure_message: '测试失败'

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        run: ./deploy.sh

      - name: Notify Deploy Result
        if: always()
        uses: palemoky/xiaomi-speaker-action@v1
        with:
          webhook_url: ${{ secrets.XIAOMI_WEBHOOK_URL }}
          success_message: '部署成功到生产环境'
          failure_message: '部署失败，请立即检查'
```

### With Retry Configuration

```yaml
- name: Notify with Custom Retry
  uses: palemoky/xiaomi-speaker-action@v1
  with:
    webhook_url: ${{ secrets.XIAOMI_WEBHOOK_URL }}
    message: '重要通知'
    max_retries: 3
    timeout: 15000
```

## 🔧 Setup

### 1. Deploy Xiaomi Speaker Service

First, deploy the [xiaomi-speaker](https://github.com/palemoky/xiaomi-speaker) service:

```bash
docker run -d \
  -e MI_USER=your_xiaomi_account \
  -e MI_PASS=your_password \
  -e MI_DID=your_device_id \
  -e API_SECRET=your_secret \
  -p 2010:2010 \
  palemoky/xiaomi-speaker:latest
```

### 2. Configure GitHub Secrets

Add these secrets to your repository (Settings → Secrets → Actions):

- `XIAOMI_WEBHOOK_URL`: Your webhook URL (e.g., `https://your-domain.com`)
- `XIAOMI_API_SECRET`: Your API secret (optional but recommended)

### 3. Use in Workflow

Add the action to your workflow as shown in the examples above.

## 📡 Payload Structure

The action sends the following payload to your webhook:

```json
{
  "message": "Your notification message",
  "metadata": {
    "repository": "repo-name",
    "workflow": "CI"
  },
  "custom": {
    "your": "custom fields"
  }
}
```

**Note**: Set `include_owner: true` to add `owner` field to metadata.

## 🔄 Retry Mechanism

The action automatically retries failed requests with exponential backoff:

- **Attempt 1**: Immediate
- **Attempt 2**: After 1 second
- **Attempt 3**: After 2 seconds
- **Attempt 4**: After 4 seconds

Configure `max_retries` to adjust the number of retry attempts (default: 2).

## ⚠️ Error Handling

**Important**: Notification failures will NOT block your workflow. The action uses `core.warning` instead of `core.setFailed`, so your CI/CD pipeline continues even if the notification fails.

Check the `status` output to determine if the notification was successful:

```yaml
- name: Notify
  id: notify
  uses: palemoky/xiaomi-speaker-action@v1
  with:
    webhook_url: ${{ secrets.XIAOMI_WEBHOOK_URL }}
    message: "Test"

- name: Check Status
  run: echo "Notification status: ${{ steps.notify.outputs.status }}"
```

## 🧪 Development

```bash
# Install dependencies
bun install

# Type check
bun run typecheck

# Run tests
bun test

# Build
bun run build

# Format code
bun run format
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Related Projects

- [xiaomi-speaker](https://github.com/palemoky/xiaomi-speaker) - The backend service for this action

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
