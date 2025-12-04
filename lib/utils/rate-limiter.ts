/**
 * Client-side Rate Limiter Utility
 * Prevents excessive API calls and provides throttling/debouncing
 */

// ============================================
// Types
// ============================================

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional callback when rate limit is exceeded */
  onLimitExceeded?: () => void;
}

interface ThrottleOptions {
  /** Minimum time between calls in milliseconds */
  wait: number;
  /** Call immediately on first invocation */
  leading?: boolean;
  /** Call after the wait period on last invocation */
  trailing?: boolean;
}

interface DebounceOptions {
  /** Wait time in milliseconds */
  wait: number;
  /** Call immediately on first invocation */
  immediate?: boolean;
  /** Maximum time to wait before forcing execution */
  maxWait?: number;
}

// RateLimitState is used internally by RateLimiter

// ============================================
// Rate Limiter Class
// ============================================

export class RateLimiter {
  private limit: number;
  private windowMs: number;
  private tokens: number[] = [];
  private onLimitExceeded?: () => void;

  constructor(options: RateLimitOptions) {
    this.limit = options.limit;
    this.windowMs = options.windowMs;
    this.onLimitExceeded = options.onLimitExceeded;
  }

  /**
   * Check if a request is allowed
   */
  canMakeRequest(): boolean {
    this.cleanup();
    return this.tokens.length < this.limit;
  }

  /**
   * Record a request
   */
  recordRequest(): boolean {
    this.cleanup();

    if (this.tokens.length >= this.limit) {
      this.onLimitExceeded?.();
      return false;
    }

    this.tokens.push(Date.now());
    return true;
  }

  /**
   * Get remaining requests in current window
   */
  getRemainingRequests(): number {
    this.cleanup();
    return Math.max(0, this.limit - this.tokens.length);
  }

  /**
   * Get time until next request is allowed (in ms)
   */
  getTimeUntilReset(): number {
    if (this.tokens.length === 0) return 0;

    const oldestToken = Math.min(...this.tokens);
    const resetTime = oldestToken + this.windowMs;
    return Math.max(0, resetTime - Date.now());
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.tokens = [];
  }

  /**
   * Remove expired tokens
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    this.tokens = this.tokens.filter((t) => t > windowStart);
  }
}

// ============================================
// Throttle Function
// ============================================

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  options: ThrottleOptions,
): ((...args: Parameters<T>) => ReturnType<T> | undefined) & {
  cancel: () => void;
} {
  const { wait, leading = true, trailing = true } = options;

  let lastCallTime: number | null = null;
  let lastResult: ReturnType<T> | undefined;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const invokeFunc = (args: Parameters<T>): ReturnType<T> | undefined => {
    lastCallTime = Date.now();
    lastResult = func(...args) as ReturnType<T>;
    return lastResult;
  };

  const throttled = (...args: Parameters<T>): ReturnType<T> | undefined => {
    const now = Date.now();
    const timeSinceLastCall = lastCallTime ? now - lastCallTime : wait;

    lastArgs = args;

    // Leading edge
    if (timeSinceLastCall >= wait) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (leading) {
        return invokeFunc(args);
      } else {
        lastCallTime = now;
      }
    }

    // Schedule trailing edge
    if (trailing && !timeoutId) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (trailing && lastArgs) {
          invokeFunc(lastArgs);
        }
      }, wait - timeSinceLastCall);
    }

    return lastResult;
  };

  // Add cancel method
  const throttledWithCancel = throttled as ((
    ...args: Parameters<T>
  ) => ReturnType<T> | undefined) & { cancel: () => void };
  throttledWithCancel.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCallTime = null;
    lastArgs = null;
  };

  return throttledWithCancel;
}

// ============================================
// Debounce Function
// ============================================

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  options: DebounceOptions,
): ((...args: Parameters<T>) => void) & {
  cancel: () => void;
  flush: () => void;
} {
  const { wait, immediate = false, maxWait } = options;

  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime: number | null = null;
  let result: ReturnType<T> | undefined;

  const invokeFunc = (): ReturnType<T> | undefined => {
    if (lastArgs) {
      result = func(...lastArgs) as ReturnType<T>;
      lastArgs = null;
      lastCallTime = null;
    }
    return result;
  };

  const cancelMaxTimeout = () => {
    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId);
      maxTimeoutId = null;
    }
  };

  const debounced = (...args: Parameters<T>): void => {
    const now = Date.now();
    lastArgs = args;

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Immediate execution on first call
    if (immediate && !lastCallTime) {
      lastCallTime = now;
      invokeFunc();
      return;
    }

    lastCallTime = now;

    // Schedule execution
    timeoutId = setTimeout(() => {
      timeoutId = null;
      cancelMaxTimeout();
      invokeFunc();
    }, wait);

    // Max wait timeout
    if (maxWait && !maxTimeoutId) {
      maxTimeoutId = setTimeout(() => {
        maxTimeoutId = null;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        invokeFunc();
      }, maxWait);
    }
  };

  // Cancel method
  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    cancelMaxTimeout();
    lastArgs = null;
    lastCallTime = null;
  };

  // Flush method - execute immediately
  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    cancelMaxTimeout();
    invokeFunc();
  };

  return debounced;
}

// ============================================
// Request Queue
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface QueuedRequest<T = any> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  priority: number;
}

export class RequestQueue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private queue: QueuedRequest<any>[] = [];
  private processing = false;
  private concurrency: number;
  private activeRequests = 0;
  private delay: number;

  constructor(options: { concurrency?: number; delay?: number } = {}) {
    this.concurrency = options.concurrency ?? 2;
    this.delay = options.delay ?? 100;
  }

  /**
   * Add a request to the queue
   */
  add<T>(execute: () => Promise<T>, priority: number = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ execute, resolve, reject, priority });
      // Sort by priority (higher first)
      this.queue.sort((a, b) => b.priority - a.priority);
      this.processQueue();
    });
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.activeRequests >= this.concurrency) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeRequests < this.concurrency) {
      const request = this.queue.shift();
      if (!request) continue;

      this.activeRequests++;

      // Execute with delay between requests
      request
        .execute()
        .then(request.resolve)
        .catch(request.reject)
        .finally(() => {
          this.activeRequests--;
          setTimeout(() => this.processQueue(), this.delay);
        });
    }

    this.processing = false;
  }

  /**
   * Get queue length
   */
  get length(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    const error = new Error("Queue cleared");
    this.queue.forEach((request) => request.reject(error));
    this.queue = [];
  }
}

// ============================================
// Retry with Backoff
// ============================================

interface RetryOptions {
  /** Maximum number of retries */
  maxRetries?: number;
  /** Initial delay in ms */
  initialDelay?: number;
  /** Maximum delay in ms */
  maxDelay?: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier?: number;
  /** Add jitter to prevent thundering herd */
  jitter?: boolean;
  /** Retry only on specific error conditions */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  /** Callback on each retry */
  onRetry?: (error: Error, attempt: number) => void;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt >= maxRetries || !shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      onRetry?.(lastError, attempt);

      // Calculate delay with exponential backoff
      let delay = initialDelay * Math.pow(backoffMultiplier, attempt);
      delay = Math.min(delay, maxDelay);

      // Add jitter (±25%)
      if (jitter) {
        const jitterFactor = 0.75 + Math.random() * 0.5;
        delay = Math.floor(delay * jitterFactor);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ============================================
// Circuit Breaker
// ============================================

type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold?: number;
  /** Time to wait before trying again (ms) */
  resetTimeout?: number;
  /** Number of successful calls to close circuit */
  successThreshold?: number;
  /** Callback when state changes */
  onStateChange?: (state: CircuitState) => void;
}

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private successes = 0;
  private lastFailureTime: number | null = null;
  private failureThreshold: number;
  private resetTimeout: number;
  private successThreshold: number;
  private onStateChange?: (state: CircuitState) => void;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30000;
    this.successThreshold = options.successThreshold ?? 2;
    this.onStateChange = options.onStateChange;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (this.shouldTryAgain()) {
        this.transitionTo("half-open");
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Check if circuit is available
   */
  isAvailable(): boolean {
    if (this.state === "closed") return true;
    if (this.state === "open") return this.shouldTryAgain();
    return true; // half-open
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.transitionTo("closed");
  }

  private recordSuccess(): void {
    if (this.state === "half-open") {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.reset();
      }
    } else {
      this.failures = 0;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.successes = 0;

    if (this.failures >= this.failureThreshold) {
      this.transitionTo("open");
    }
  }

  private shouldTryAgain(): boolean {
    if (!this.lastFailureTime) return true;
    return Date.now() - this.lastFailureTime >= this.resetTimeout;
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.onStateChange?.(newState);
    }
  }
}

// ============================================
// Preset Rate Limiters
// ============================================

export const rateLimiters = {
  /** For API calls - 60 per minute */
  api: new RateLimiter({ limit: 60, windowMs: 60000 }),

  /** For sync operations - 10 per minute */
  sync: new RateLimiter({ limit: 10, windowMs: 60000 }),

  /** For Telegram notifications - 30 per minute */
  telegram: new RateLimiter({ limit: 30, windowMs: 60000 }),

  /** For search/filter operations - 100 per minute */
  search: new RateLimiter({ limit: 100, windowMs: 60000 }),
};

// ============================================
// Export Default
// ============================================

const rateLimiterModule = {
  RateLimiter,
  throttle,
  debounce,
  RequestQueue,
  retryWithBackoff,
  CircuitBreaker,
  rateLimiters,
};

export default rateLimiterModule;
