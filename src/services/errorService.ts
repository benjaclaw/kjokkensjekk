import { Alert } from "react-native";

export function showError(title: string, message: string): void {
  Alert.alert(title, message, [{ text: "OK" }]);
}

export function handleAsyncError(
  action: string,
  error: unknown,
): void {
  const message =
    error instanceof Error ? error.message : "En ukjent feil oppstod";
  console.error(`[${action}]`, message);
  showError("Feil", `Kunne ikke ${action.toLowerCase()}. Prøv igjen.`);
}

export async function withErrorHandling<T>(
  action: string,
  fn: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    handleAsyncError(action, error);
    return undefined;
  }
}
