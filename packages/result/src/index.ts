/**
 * Represents a successful result
 */
export class Ok<T> {
  public readonly ok = true as const
  public readonly value: T

  public constructor(value: T) {
    this.value = value
  }

  /**
   * Check if the result is Ok
   * @returns true if the result is Ok, false otherwise
   */
  public isOk(): this is Ok<T> {
    return true
  }

  /**
   * Check if the result is Err
   * @returns true if the result is Err, false otherwise
   */
  public isErr(): this is never {
    return false
  }

  /**
   * Unwrap the value if it's Ok, otherwise throw an error
   * @returns the unwrapped value
   * @throws Error if the result is Err
   */
  public unwrap(): T {
    return this.value
  }

  /**
   * Unwrap the value if it's Ok, otherwise return a default value
   * @param defaultValue The default value to return if the result is Err
   * @returns the unwrapped value or the default value
   */
  public unwrapOr<U>(_defaultValue: U): T | U {
    return this.value
  }

  /**
   * Map the value if it's Ok, otherwise return an Err
   * @param fn The function to apply to the value if it's Ok
   * @returns a new Result with the mapped value or the original Err
   */
  public map<U>(fn: (value: T) => U): Result<U, never> {
    return ok(fn(this.value))
  }

  /**
   * Map the error if it's Err, otherwise return an Ok
   * @param fn The function to apply to the error if it's Err
   * @returns a new Result with the original Ok or the mapped Err
   */
  public mapErr<F extends Error>(_fn: (error: never) => F): Result<T, F> {
    return ok(this.value)
  }

  /**
   * Chain another Result-producing function if this is Ok, otherwise return an Err
   * @param fn The function to apply to the value if it's Ok
   * @returns a new Result from the chained function or the original Err
   */
  public andThen<U, F extends Error>(
    fn: (value: T) => Result<U, F>,
  ): Result<U, F> {
    return fn(this.value)
  }
}

/**
 * Represents a failed result
 */
export class Err<E extends Error> {
  public readonly ok = false as const
  public readonly error: E

  public constructor(error: E) {
    this.error = error
  }

  /**
   * Check if the result is Ok
   * @returns true if the result is Ok, false otherwise
   */
  public isOk(): this is never {
    return false
  }

  /**
   * Check if the result is Err
   * @returns true if the result is Err, false otherwise
   */
  public isErr(): this is Err<E> {
    return true
  }

  /**
   * Unwrap the value if it's Ok, otherwise throw an error
   * @returns the unwrapped value
   * @throws Error if the result is Err
   */
  public unwrap(): never {
    throw new Error(
      `Called unwrap on an Err value: ${JSON.stringify(this.error)}`,
    )
  }

  /**
   * Unwrap the value if it's Ok, otherwise return a default value
   * @param defaultValue The default value to return if the result is Err
   * @returns the unwrapped value or the default value
   */
  public unwrapOr<T>(defaultValue: T): T {
    return defaultValue
  }

  /**
   * Map the value if it's Ok, otherwise return an Err
   * @param fn The function to apply to the value if it's Ok
   * @returns a new Result with the mapped value or the original Err
   */
  public map<U>(_fn: (value: never) => U): Result<U, E> {
    return err(this.error)
  }

  /**
   * Map the error if it's Err, otherwise return an Ok
   * @param fn The function to apply to the error if it's Err
   * @returns a new Result with the original Ok or the mapped Err
   */
  public mapErr<F extends Error>(fn: (error: E) => F): Result<never, F> {
    return err(fn(this.error))
  }

  /**
   * Chain another Result-producing function if this is Ok, otherwise return an Err
   * @param fn The function to apply to the value if it's Ok
   * @returns a new Result from the chained function or the original Err
   */
  public andThen<U, F extends Error>(
    _fn: (value: never) => Result<U, F>,
  ): Result<U, E | F> {
    return err(this.error)
  }
}

/**
 * Result type that can be either Ok or Err
 */
export type Result<T, E extends Error> = Ok<T> | Err<E>

/**
 * Create a successful result
 */
export function ok<T>(value: T): Ok<T> {
  return new Ok(value)
}

/**
 * Create a failed result
 */
export function err<E extends Error>(error: E): Err<E> {
  return new Err(error)
}

/**
 * Helper to wrap a function that might throw into a Result
 */
export function tryCatch<T, E extends Error = Error>(
  fn: () => T,
  errorHandler?: (error: unknown) => E,
): Result<T, E> {
  try {
    return ok(fn())
  } catch (error) {
    if (errorHandler) {
      return err(errorHandler(error))
    }
    return err(error as E)
  }
}

/**
 * Helper to wrap an async function that might throw into a Result
 */
export async function tryCatchAsync<T, E extends Error = Error>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => E,
): Promise<Result<T, E>> {
  try {
    return ok(await fn())
  } catch (error) {
    if (errorHandler) {
      return err(errorHandler(error))
    }
    return err(error as E)
  }
}
