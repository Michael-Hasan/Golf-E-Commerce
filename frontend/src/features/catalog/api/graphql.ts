import { GRAPHQL_ENDPOINT } from "../../../config/app-config";
export type GraphqlResult<TData> = {
  data?: TData;
  error?: string;
};

export async function callGraphql<TData>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<GraphqlResult<TData>> {
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
      });

      const rawBody = await res.text();
      if (!rawBody.trim()) {
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 250));
          continue;
        }
        return {
          error: `The backend at ${GRAPHQL_ENDPOINT} returned an empty response.`,
        };
      }

      let json: {
        data?: TData;
        errors?: Array<{ message?: string }>;
      };

      try {
        json = JSON.parse(rawBody);
      } catch {
        const contentType =
          res.headers.get("content-type") ?? "unknown content type";
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 250));
          continue;
        }
        return {
          error: `The backend at ${GRAPHQL_ENDPOINT} returned an invalid response (${contentType}).`,
        };
      }

      if (!res.ok) {
        return {
          error:
            json.errors?.[0]?.message ??
            `Request failed with status ${res.status} ${res.statusText}`,
        };
      }

      if (json.errors && json.errors.length) {
        return { error: json.errors[0].message ?? "Unknown error" };
      }

      return { data: json.data };
    } catch (error) {
      if (error instanceof TypeError && attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 250));
        continue;
      }
      if (error instanceof TypeError) {
        return {
          error: `Could not reach the backend at ${GRAPHQL_ENDPOINT}. Make sure the backend server is running.`,
        };
      }
      return {
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  return {
    error: `Could not reach the backend at ${GRAPHQL_ENDPOINT}. Make sure the backend server is running.`,
  };
}
