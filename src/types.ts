/**
 * Action input parameters from action.yml
 */
export interface ActionInputs {
  webhook_url: string;
  api_secret: string;
  cf_client_id?: string;
  cf_client_secret?: string;
  message?: string;
  success_message?: string;
  failure_message?: string;
  job_status: 'success' | 'failure' | 'cancelled';
  timeout: number;
  max_retries: number;
  include_owner: boolean;
}

/**
 * Webhook payload sent to Xiaomi Speaker service
 */
export interface WebhookPayload {
  message: string;
  metadata?: {
    owner?: string; // GitHub owner (optional, controlled by include_owner)
    repository: string; // Repository name
    workflow: string; // Workflow name
  };
}

/**
 * API response from Xiaomi Speaker service
 */
export interface ApiResponse {
  status: string;
  message: string;
  notification_sent: boolean;
}

/**
 * Retry configuration for HTTP requests
 */
export interface RetryConfig {
  maxRetries: number;
  timeout: number;
}
