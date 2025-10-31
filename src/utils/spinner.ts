import ora, { Ora } from "ora";

/**
 * Executes an async operation with a spinner, handling success and failure states
 */
export async function withSpinner<T>(
  loadingMessage: string,
  successMessage: string,
  failureMessage: string,
  operation: () => Promise<T>
): Promise<T> {
  const spinner = ora(loadingMessage).start();

  try {
    const result = await operation();
    spinner.succeed(successMessage);
    return result;
  } catch (error) {
    spinner.fail(failureMessage);
    throw error;
  }
}

/**
 * Creates a manual spinner for cases where you need more control over the lifecycle
 */
export function createSpinner(message: string): Ora {
  return ora(message);
}

/**
 * Executes an operation with a spinner, allowing custom success/failure handling
 */
export async function withSpinnerCustom<T>(
  loadingMessage: string,
  operation: (spinner: Ora) => Promise<T>
): Promise<T> {
  const spinner = ora(loadingMessage).start();
  return operation(spinner);
}
