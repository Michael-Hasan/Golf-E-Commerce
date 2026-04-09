import type { GraphqlResult } from "../api/graphql";

export function ensureField<
  TData,
  TKey extends keyof TData,
>(
  result: GraphqlResult<TData>,
  key: TKey,
  missingMessage: string,
): { data?: TData[TKey]; error?: string } {
  if (result.error) {
    return { error: result.error };
  }
  const value = result.data?.[key];
  if (value === undefined || value === null) {
    return { error: missingMessage };
  }
  return { data: value };
}
