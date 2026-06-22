function isDeadlockError(error: any): boolean {
  return (
    error?.number === 1205 ||
    error?.originalError?.info?.number === 1205 ||
    error?.code === "EREQUEST" && error?.number === 1205
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeWithDeadlockRetry<T>(
  action: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await action();
    } catch (error: any) {
      lastError = error;

      if (!isDeadlockError(error) || attempt === maxRetries) {
        throw error;
      }

      await delay(attempt * 200);
    }
  }

  throw lastError;
}