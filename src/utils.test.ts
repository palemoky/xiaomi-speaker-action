import { describe, test, expect } from 'bun:test';
import { resolveMessage, buildPayload, getRetryDelay } from './utils';
import type { ActionInputs } from './types';

describe('resolveMessage', () => {
  const baseInputs: ActionInputs = {
    webhook_url: 'https://example.com',
    api_secret: 'test-secret',
    job_status: 'success',
    timeout: 10000,
    max_retries: 2,
    include_owner: false,
  };

  test('should use success_message when job_status is success', () => {
    const inputs: ActionInputs = {
      ...baseInputs,
      success_message: 'Build succeeded!',
      failure_message: 'Build failed!',
      message: 'Generic message',
    };

    expect(resolveMessage(inputs)).toBe('Build succeeded!');
  });

  test('should use failure_message when job_status is failure', () => {
    const inputs: ActionInputs = {
      ...baseInputs,
      job_status: 'failure',
      success_message: 'Build succeeded!',
      failure_message: 'Build failed!',
      message: 'Generic message',
    };

    expect(resolveMessage(inputs)).toBe('Build failed!');
  });

  test('should use failure_message when job_status is cancelled', () => {
    const inputs: ActionInputs = {
      ...baseInputs,
      job_status: 'cancelled',
      failure_message: 'Build cancelled!',
    };

    expect(resolveMessage(inputs)).toBe('Build cancelled!');
  });

  test('should fallback to message when status-specific message is not set', () => {
    const inputs: ActionInputs = {
      ...baseInputs,
      message: 'Generic message',
    };

    expect(resolveMessage(inputs)).toBe('Generic message');
  });

  test('should generate default message when no messages are set', () => {
    const inputs: ActionInputs = {
      ...baseInputs,
      job_status: 'success',
    };

    expect(resolveMessage(inputs)).toBe('Workflow success');
  });
});

describe('buildPayload', () => {
  const baseInputs: ActionInputs = {
    webhook_url: 'https://example.com',
    api_secret: 'test-secret',
    job_status: 'success',
    timeout: 10000,
    max_retries: 2,
    include_owner: false,
  };

  const mockContext = {
    repo: {
      owner: 'testowner',
      repo: 'testrepo',
    },
    workflow: 'CI',
  } as any;

  test('should build basic payload without owner', () => {
    const payload = buildPayload('Test message', baseInputs, mockContext);

    expect(payload).toEqual({
      message: 'Test message',
      metadata: {
        repository: 'testrepo',
        workflow: 'CI',
      },
    });
  });

  test('should include owner when include_owner is true', () => {
    const inputs: ActionInputs = {
      ...baseInputs,
      include_owner: true,
    };

    const payload = buildPayload('Test message', inputs, mockContext);

    expect(payload).toEqual({
      message: 'Test message',
      metadata: {
        owner: 'testowner',
        repository: 'testrepo',
        workflow: 'CI',
      },
    });
  });

  test('should add custom payload to custom field', () => {
    const inputs: ActionInputs = {
      ...baseInputs,
      custom_payload: JSON.stringify({
        environment: 'production',
        version: '1.0.0',
      }),
    };

    const payload = buildPayload('Test message', inputs, mockContext);

    expect(payload).toEqual({
      message: 'Test message',
      metadata: {
        repository: 'testrepo',
        workflow: 'CI',
      },
      custom: {
        environment: 'production',
        version: '1.0.0',
      },
    });
  });

  test('should throw error for invalid custom_payload JSON', () => {
    const inputs: ActionInputs = {
      ...baseInputs,
      custom_payload: 'invalid json',
    };

    expect(() => buildPayload('Test message', inputs, mockContext)).toThrow(
      /Invalid custom_payload JSON/
    );
  });
});

describe('getRetryDelay', () => {
  test('should calculate exponential backoff correctly', () => {
    expect(getRetryDelay(0)).toBe(1000); // 2^0 * 1000 = 1s
    expect(getRetryDelay(1)).toBe(2000); // 2^1 * 1000 = 2s
    expect(getRetryDelay(2)).toBe(4000); // 2^2 * 1000 = 4s
    expect(getRetryDelay(3)).toBe(8000); // 2^3 * 1000 = 8s
  });

  test('should use custom base delay', () => {
    expect(getRetryDelay(0, 500)).toBe(500); // 2^0 * 500 = 500ms
    expect(getRetryDelay(1, 500)).toBe(1000); // 2^1 * 500 = 1s
    expect(getRetryDelay(2, 500)).toBe(2000); // 2^2 * 500 = 2s
  });
});
