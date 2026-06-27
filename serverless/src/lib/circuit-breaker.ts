type State = "closed" | "open" | "half-open";

interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  name: string;
}

const defaultConfig: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeoutMs: 30000,
  name: "unknown",
};

class CircuitBreakerState {
  state: State = "closed";
  failureCount = 0;
  successCount = 0;
  lastFailureTime = 0;

  constructor(public config: CircuitBreakerConfig) {}

  recordSuccess() {
    if (this.state === "half-open") {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = "closed";
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = "open";
    }
  }

  canProceed(): boolean {
    if (this.state === "closed") return true;
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime >= this.config.timeoutMs) {
        this.state = "half-open";
        this.successCount = 0;
        return true;
      }
      return false;
    }
    return true;
  }
}

const instances = new Map<string, CircuitBreakerState>();

export const getCircuitBreaker = (name: string, overrides?: Partial<CircuitBreakerConfig>) => {
  let instance = instances.get(name);
  if (!instance) {
    instance = new CircuitBreakerState({ ...defaultConfig, name, ...overrides });
    instances.set(name, instance);
  }
  return instance;
};

export const circuitBreakerWrapper = async <T>(
  name: string,
  fn: () => Promise<T>,
  fallback?: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>,
): Promise<T> => {
  const cb = getCircuitBreaker(name, config);

  if (!cb.canProceed()) {
    console.warn(`[circuit-breaker] ${name} is open, using fallback`);
    if (fallback) return fallback();
    throw new Error(`Circuit breaker ${name} is open`);
  }

  try {
    const result = await fn();
    cb.recordSuccess();
    return result;
  } catch (error) {
    cb.recordFailure();
    console.error(`[circuit-breaker] ${name} failed (${cb.failureCount}/${cb.config.failureThreshold}):`, error);
    if (fallback) return fallback();
    throw error;
  }
};
