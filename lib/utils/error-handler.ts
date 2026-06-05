import { toast } from "sonner";

/**
 * Custom error mapping for standard API/database/auth errors
 */
export function getFriendlyErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred.";

  // Handle Supabase/Postgres errors
  if (typeof error === "object") {
    const code = error.code;
    const message = error.message || "";

    // Postgres / Database codes
    if (code) {
      switch (code) {
        case "23505": // unique_violation
          return "This record already exists.";
        case "23503": // foreign_key_violation
          return "Referenced record could not be found.";
        case "42P01": // undefined_table
          return "System configuration error. Please contact support.";
        case "PGRST116": // multiple or no rows where exactly one expected
          return "The requested record was not found.";
      }
    }

    // Supabase Auth errors
    if (message.includes("Invalid login credentials")) {
      return "Invalid email or password. Please try again.";
    }
    if (message.includes("Email not confirmed")) {
      return "Please confirm your email address before signing in.";
    }
    if (message.includes("User already registered")) {
      return "An account with this email address already exists.";
    }
    if (message.includes("Password should be")) {
      return "Password must be at least 6 characters long.";
    }
    if (message.includes("JWT")) {
      return "Your session has expired. Please sign in again.";
    }

    return message || "A database or connection error occurred.";
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Centralized API error logger and toast trigger
 */
export function handleApiError(error: any, contextDescription?: string) {
  const friendlyMessage = getFriendlyErrorMessage(error);
  
  // Structured error logging
  console.error(`[API Error] Context: ${contextDescription || "General"} | Raw Error:`, error);

  // Trigger Sonner toast
  toast.error(friendlyMessage);
  
  return friendlyMessage;
}

/**
 * Reusable helper to execute an asynchronous call with exponential backoff retry.
 * Only retries on presumably transient network issues (timeouts, server errors, rate limits).
 */
export async function retryApiCall<T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000,
  context?: string
): Promise<T> {
  let attempt = 0;
  
  while (true) {
    try {
      return await action();
    } catch (error: any) {
      attempt++;
      
      const isTransient = 
        !error.status || // Network offline / DNS issues
        error.status === 408 || // Request Timeout
        error.status === 429 || // Too Many Requests (Rate Limit)
        (error.status >= 500 && error.status <= 599); // Server Errors

      if (!isTransient || attempt >= maxRetries) {
        if (context) {
          console.error(`[Retry Failed] ${context} failed after ${attempt} attempts.`, error);
        }
        throw error;
      }

      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      console.warn(
        `[Retry Warning] ${context || "API Call"} failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
