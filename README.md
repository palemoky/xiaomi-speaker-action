# Xiaomi Speaker GitHub Action

[![GitHub Action](https://img.shields.io/badge/GitHub-Action-blue?logo=github-actions)](https://github.com/palemoky/xiaomi-speaker-action)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0-orange?logo=bun)](https://bun.sh/)

Send voice notifications via Xiaomi Speaker from your GitHub Actions workflows. Perfect for CI/CD alerts, deployment notifications, and build status updates.

## ✨ Features

- 🎯 **Smart Message Routing** - Different messages for success/failure scenarios
- 🔄 **Auto Retry** - Exponential backoff retry mechanism (configurable)
- 🔐 **Secure** - Multiple authentication options (API Secret, Cloudflare Access)
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
      - uses: actions/checkout@v6

      - name: Build
        run: npm run build

      - name: Notify via Xiaomi Speaker
        if: always()
        uses: palemoky/xiaomi-speaker-action@v1
        with:
          webhook_url: ${{ vars.SPEAKER_WEBHOOK_URL }}
          api_secret: ${{ secrets.SPEAKER_API_SECRET }}
          cf_client_id: ${{ secrets.CF_ACCESS_CLIENT_ID }}
          cf_client_secret: ${{ secrets.CF_ACCESS_CLIENT_SECRET }}
          message: 'Default message.'
          success_message: 'Build succeeded for ${{ github.repository }}'
          failure_message: 'Build failed for ${{ github.repository }}'
          max_retries: 2
          timeout: 10000
```

## 📋 Inputs

| Input              | Required | Default             | Description                                                                                                                                           |
| ------------------ | -------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `webhook_url`      | ✓        | -                   | Your Cloudflare Tunnel domain (e.g., `https://speaker.example.com`), **Do NOT include** the `/webhook/custom` path - the action adds it automatically |
| `api_secret`       | ✓        | -                   | API secret for authentication                                                                                                                         |
| `cf_client_id`     | ✕        | -                   | Cloudflare Access Client ID (recommended for CF layer protection)                                                                                     |
| `cf_client_secret` | ✕        | -                   | Cloudflare Access Client Secret (recommended for CF layer protection)                                                                                 |
| `message`          | ✕        | -                   | Default message (fallback)                                                                                                                            |
| `success_message`  | ✕        | -                   | Message for successful jobs                                                                                                                           |
| `failure_message`  | ✕        | -                   | Message for failed/cancelled jobs                                                                                                                     |
| `job_status`       | ✕        | `${{ job.status }}` | Job status (auto-detected)                                                                                                                            |
| `timeout`          | ✕        | `10000`             | Request timeout (ms)                                                                                                                                  |
| `max_retries`      | ✕        | `2`                 | Maximum retry attempts                                                                                                                                |
| `include_owner`    | ✕        | `false`             | Include repo owner in metadata                                                                                                                        |

## 📤 Outputs

| Output         | Description                            |
| -------------- | -------------------------------------- |
| `status`       | Request status (`success` or `failed`) |
| `response`     | API response body (JSON string)        |
| `message_sent` | The actual message that was sent       |

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

### 2. Configure GitHub Variables and Secrets

#### Variables (Settings → Secrets and variables → Actions → Variables tab)

**Required:**

- `SPEAKER_WEBHOOK_URL`: Your Cloudflare Tunnel domain (e.g., `https://speaker.example.com`)

#### Secrets (Settings → Secrets and variables → Actions → Secrets tab)

**Required:**

- `SPEAKER_API_SECRET`: Your API secret (prevents unauthorized access)

**Optional (for Cloudflare Access):**

- `CF_ACCESS_CLIENT_ID`: Cloudflare Access Client ID
- `CF_ACCESS_CLIENT_SECRET`: Cloudflare Access Client Secret

## 🔗 Related Projects

- [xiaomi-speaker](https://github.com/palemoky/xiaomi-speaker) - The backend service for this action

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
