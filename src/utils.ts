import type { Context } from '@actions/github/lib/context';
import type { ActionInputs, WebhookPayload } from './types';

/**
 * Resolve the message to send based on job status and input parameters
 * Priority: success_message/failure_message > message > auto-generated
 */
export function resolveMessage(inputs: ActionInputs): string {
  const { job_status, message, success_message, failure_message } = inputs;

  // Priority 1: Use status-specific message
  if (job_status === 'success' && success_message) {
    return success_message;
  }

  if ((job_status === 'failure' || job_status === 'cancelled') && failure_message) {
    return failure_message;
  }

  // Priority 2: Use generic message
  if (message) {
    return message;
  }

  // Priority 3: Generate default message
  return `Workflow ${job_status}`;
}

/**
 * Build the webhook payload with message, metadata, and custom fields
 */
export function buildPayload(
  message: string,
  inputs: ActionInputs,
  context: Context
): WebhookPayload {
  const basePayload: WebhookPayload = {
    message,
    metadata: {
      repository: context.repo.repo,
      workflow: context.workflow,
    },
  };

  // Add owner if requested
  if (inputs.include_owner) {
    basePayload.metadata!.owner = context.repo.owner;
  }

  return basePayload;
}

/**
 * Sleep for specified milliseconds (used for retry delays)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay for retries
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds (default: 1000ms)
 */
export function getRetryDelay(attempt: number, baseDelay: number = 1000): number {
  // Exponential backoff: 1s, 2s, 4s, 8s...
  return baseDelay * Math.pow(2, attempt);
}
