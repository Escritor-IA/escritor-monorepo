function firstString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstString(item);
      if (found) return found;
    }
  }
  return null;
}

/**
 * DRF errors show up in several shapes depending on the endpoint: a plain string,
 * a bare list (["msg"]), {detail: "msg"}, or {field: ["msg"]}/{non_field_errors: [...]}.
 * This normalizes all of them into a single user-facing string, falling back when
 * the payload is missing, empty, or not recognizable.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data == null) return fallback;

  const direct = firstString(data);
  if (direct) return direct;

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.non_field_errors !== "undefined") {
      const found = firstString(obj.non_field_errors);
      if (found) return found;
    }
    for (const value of Object.values(obj)) {
      const found = firstString(value);
      if (found) return found;
    }
  }

  return fallback;
}
