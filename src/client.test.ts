import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { sendNotification } from './client';
import type { WebhookPayload, ApiResponse } from './types';

// Mock global fetch
const mockFetch = mock();
global.fetch = mockFetch as any;

describe('sendNotification', () => {
  const testUrl = 'https://example.com';
  const testPayload: WebhookPayload = {
    message: 'Test message',
    metadata: {
      repository: 'testrepo',
      workflow: 'CI',
    },
  };

  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('should send successful request without retry', async () => {
    const mockResponse: ApiResponse = {
      status: 'processed',
      message: 'Test message',
      notification_sent: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await sendNotification(
      testUrl,
      testPayload,
      {},
      {
        maxRetries: 2,
        timeout: 10000,
      }
    );

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('should include API secret in headers when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'processed', message: 'Test', notification_sent: true }),
    });

    await sendNotification(
      testUrl,
      testPayload,
      { apiSecret: 'secret123' },
      {
        maxRetries: 0,
        timeout: 10000,
      }
    );

    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].headers['Speaker-API-Secret']).toBe('secret123');
  });

  test('should include Cloudflare Access headers when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'processed', message: 'Test', notification_sent: true }),
    });

    await sendNotification(
      testUrl,
      testPayload,
      {
        cfAccessClientId: 'client-id-123',
        cfAccessClientSecret: 'client-secret-456',
      },
      {
        maxRetries: 0,
        timeout: 10000,
      }
    );

    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].headers['CF-Access-Client-Id']).toBe('client-id-123');
    expect(callArgs[1].headers['CF-Access-Client-Secret']).toBe('client-secret-456');
  });

  test('should retry on failure and succeed', async () => {
    const mockResponse: ApiResponse = {
      status: 'processed',
      message: 'Test message',
      notification_sent: true,
    };

    // First call fails, second succeeds
    mockFetch.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await sendNotification(
      testUrl,
      testPayload,
      {},
      {
        maxRetries: 2,
        timeout: 10000,
      }
    );

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test('should throw error after all retries exhausted', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(
      sendNotification(
        testUrl,
        testPayload,
        {},
        {
          maxRetries: 2,
          timeout: 10000,
        }
      )
    ).rejects.toThrow(/Failed after 3 attempts/);

    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  test('should handle HTTP error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Server error details',
    });

    await expect(
      sendNotification(
        testUrl,
        testPayload,
        {},
        {
          maxRetries: 0,
          timeout: 10000,
        }
      )
    ).rejects.toThrow(/HTTP 500/);
  });

  test('should remove trailing slash from webhook URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'processed', message: 'Test', notification_sent: true }),
    });

    await sendNotification(
      'https://example.com/',
      testPayload,
      {},
      {
        maxRetries: 0,
        timeout: 10000,
      }
    );

    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[0]).toBe('https://example.com/webhook/custom');
  });
});
