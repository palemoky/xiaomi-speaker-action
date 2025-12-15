import * as core from '@actions/core';
import type { WebhookPayload, ApiResponse, RetryConfig } from './types';
import { sleep, getRetryDelay } from './utils';

/**
 * Send notification to Xiaomi Speaker webhook with retry mechanism
 */
export async function sendNotification(
  webhookUrl: string,
  payload: WebhookPayload,
  apiSecret: string | undefined,
  config: RetryConfig
): Promise<ApiResponse> {
  const url = `${webhookUrl.replace(/\/$/, '')}/webhook/custom`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'xiaomi-speaker-action/1.0',
  };

  if (apiSecret) {
    headers['X-API-Key'] = apiSecret;
  }

  core.debug(`Sending request to: ${url}`);
  core.debug(`Payload: ${JSON.stringify(payload, null, 2)}`);

  let lastError: Error | null = null;

  // Retry loop: attempt 0, 1, 2, ... up to maxRetries
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Add delay before retry (skip on first attempt)
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1);
        core.info(`Retry attempt ${attempt}/${config.maxRetries} after ${delay}ms delay...`);
        await sleep(delay);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
        }

        const result = (await response.json()) as ApiResponse;

        if (attempt > 0) {
          core.info(`✅ Request succeeded on retry attempt ${attempt}`);
        }

        return result;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Request timeout after ${config.timeout}ms`);
        }

        throw error;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't log error on last attempt (will be handled by caller)
      if (attempt < config.maxRetries) {
        core.warning(`Attempt ${attempt + 1} failed: ${lastError.message}`);
      }
    }
  }

  // All retries exhausted
  throw new Error(
    `Failed after ${config.maxRetries + 1} attempts. Last error: ${lastError?.message}`
  );
}
