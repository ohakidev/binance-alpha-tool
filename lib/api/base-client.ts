/**
 * Base API Client
 * Abstract base class for all API clients
 * Follows SOLID principles - specifically Single Responsibility and Open/Closed
 */

// ============= Types =============

export interface ApiClientConfig {
  /** Base URL for API requests */
  baseUrl: string;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Default headers for all requests */
  headers?: Record<string, string>;
  /** API key for authentication */
  apiKey?: string;
  /** Enable request caching */
  enableCache?: boolean;
  /** Cache TTL in seconds */
  cacheTtl?: number;
}

export interface RequestOptions {
  /** HTTP method */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: unknown;
  /** Query parameters */
  params?: Record<string, string | number | boolean | undefined>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable caching for this request */
  cache?: boolean;
  /** Next.js revalidation options */
  revalidate?: number | false;
  /** Signal for aborting request */
  signal?: AbortSignal;
}

export interface ApiResponse<T = unknown> {
  /** Response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Headers;
  /** Whether request was successful */
  ok: boolean;
}

export interface ApiError extends Error {
  /** HTTP status code */
  status?: number;
  /** Error code from API */
  code?: string;
  /** Original response */
  response?: Response;
}

// ============= Default Configuration =============

const DEFAULT_TIMEOUT = 30000; // 30 seconds

const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// ============= Abstract Base Class =============

/**
 * Abstract Base API Client
 * Provides common HTTP functionality for all API clients
 *
 * @abstract
 * @example
 * ```typescript
 * class MyApiClient extends BaseApiClient {
 *   constructor() {
 *     super({
 *       baseUrl: 'https://api.example.com',
 *       apiKey: process.env.API_KEY,
 *     });
 *   }
 *
 *   async getUsers() {
 *     return this.get<User[]>('/users');
 *   }
 * }
 * ```
 */
export abstract class BaseApiClient {
  protected readonly baseUrl: string;
  protected readonly timeout: number;
  protected readonly defaultHeaders: Record<string, string>;
  protected readonly apiKey?: string;
  protected readonly enableCache: boolean;
  protected readonly cacheTtl: number;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.defaultHeaders = { ...DEFAULT_HEADERS, ...config.headers };
    this.apiKey = config.apiKey;
    this.enableCache = config.enableCache ?? false;
    this.cacheTtl = config.cacheTtl ?? 60;
  }

  /**
   * Build full URL with query parameters
   */
  protected buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Merge headers with defaults
   */
  protected mergeHeaders(
    customHeaders?: Record<string, string>,
  ): Record<string, string> {
    const headers = { ...this.defaultHeaders };

    // Add API key header if available (to be overridden by subclasses)
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }

    return headers;
  }

  /**
   * Create AbortController with timeout
   */
  protected createAbortController(timeout?: number): {
    controller: AbortController;
    timeoutId: NodeJS.Timeout;
  } {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeout ?? this.timeout,
    );

    return { controller, timeoutId };
  }

  /**
   * Handle API errors
   */
  protected handleError(error: unknown, endpoint: string): never {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        const apiError: ApiError = new Error(
          `Request timeout: ${endpoint}`,
        ) as ApiError;
        apiError.name = "TimeoutError";
        throw apiError;
      }

      const apiError: ApiError = error as ApiError;
      throw apiError;
    }

    throw new Error(`Unknown error occurred: ${endpoint}`);
  }

  /**
   * Parse response based on content type
   */
  protected async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return response.json() as Promise<T>;
    }

    if (contentType.includes("text/")) {
      return response.text() as unknown as T;
    }

    return response.blob() as unknown as T;
  }

  /**
   * Make HTTP request
   * Core method that handles all HTTP communication
   */
  protected async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const {
      method = "GET",
      headers,
      body,
      params,
      timeout,
      revalidate,
      signal: externalSignal,
    } = options;

    const url = this.buildUrl(endpoint, params);
    const mergedHeaders = this.mergeHeaders(headers);

    // Create abort controller if no external signal provided
    let controller: AbortController | undefined;
    let timeoutId: NodeJS.Timeout | undefined;

    if (!externalSignal) {
      const abortSetup = this.createAbortController(timeout);
      controller = abortSetup.controller;
      timeoutId = abortSetup.timeoutId;
    }

    try {
      const fetchOptions: RequestInit & {
        next?: { revalidate?: number | false };
      } = {
        method,
        headers: mergedHeaders,
        signal: externalSignal ?? controller?.signal,
      };

      // Add body for non-GET requests
      if (body && method !== "GET") {
        fetchOptions.body = JSON.stringify(body);
      }

      // Add Next.js revalidation
      if (revalidate !== undefined) {
        fetchOptions.next = { revalidate };
      }

      const response = await fetch(url, fetchOptions);

      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Handle error responses
      if (!response.ok) {
        const errorData = await this.parseResponse<{
          message?: string;
          error?: string;
        }>(response).catch(() => ({ message: undefined, error: undefined }));

        const errorMessage =
          errorData.message ||
          errorData.error ||
          `HTTP ${response.status}: ${response.statusText}`;
        const apiError: ApiError = new Error(errorMessage) as ApiError;
        apiError.status = response.status;
        apiError.response = response;
        throw apiError;
      }

      const data = await this.parseResponse<T>(response);

      return {
        data,
        status: response.status,
        headers: response.headers,
        ok: response.ok,
      };
    } catch (error) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      this.handleError(error, endpoint);
    }
  }

  /**
   * HTTP GET request
   */
  protected async get<T = unknown>(
    endpoint: string,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
    return response.data;
  }

  /**
   * HTTP POST request
   */
  protected async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body,
    });
    return response.data;
  }

  /**
   * HTTP PUT request
   */
  protected async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body,
    });
    return response.data;
  }

  /**
   * HTTP DELETE request
   */
  protected async delete<T = unknown>(
    endpoint: string,
    options?: Omit<RequestOptions, "method">,
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
    return response.data;
  }

  /**
   * HTTP PATCH request
   */
  protected async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "method" | "body">,
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body,
    });
    return response.data;
  }

  /**
   * Health check - to be implemented by subclasses
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Get client name - to be implemented by subclasses
   */
  abstract get name(): string;
}

/**
 * Create API error helper
 */
export function createApiError(
  message: string,
  status?: number,
  code?: string,
): ApiError {
  const error: ApiError = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  return error;
}

/**
 * Type guard for API errors
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && "status" in error;
}
