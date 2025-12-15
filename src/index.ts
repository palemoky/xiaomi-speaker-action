import * as core from '@actions/core';
import * as github from '@actions/github';
import { sendNotification } from './client';
import { resolveMessage, buildPayload } from './utils';
import type { ActionInputs } from './types';

async function run(): Promise<void> {
  try {
    // 1. Read input parameters
    const inputs: ActionInputs = {
      webhook_url: core.getInput('webhook_url', { required: true }),
      api_secret: core.getInput('api_secret') || undefined,
      message: core.getInput('message') || undefined,
      success_message: core.getInput('success_message') || undefined,
      failure_message: core.getInput('failure_message') || undefined,
      job_status: (core.getInput('job_status') as ActionInputs['job_status']) || 'success',
      custom_payload: core.getInput('custom_payload') || undefined,
      timeout: parseInt(core.getInput('timeout') || '10000', 10),
      max_retries: parseInt(core.getInput('max_retries') || '2', 10),
      include_owner: core.getBooleanInput('include_owner'),
    };

    core.info(`Job status: ${inputs.job_status}`);

    // 2. Resolve the message to send
    const message = resolveMessage(inputs);
    core.info(`Resolved message: ${message}`);

    // 3. Build the webhook payload
    const payload = buildPayload(message, inputs, github.context);
    core.debug(`Final payload: ${JSON.stringify(payload, null, 2)}`);

    // 4. Send notification with retry
    const response = await sendNotification(inputs.webhook_url, payload, inputs.api_secret, {
      maxRetries: inputs.max_retries,
      timeout: inputs.timeout,
    });

    // 5. Set outputs
    core.setOutput('status', 'success');
    core.setOutput('response', JSON.stringify(response));
    core.setOutput('message_sent', message);

    core.info('✅ Notification sent successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.warning(`⚠️ Failed to send notification: ${errorMessage}`);
    core.setOutput('status', 'failed');
    // Don't call setFailed to avoid blocking the workflow
  }
}

run();
