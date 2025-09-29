// api.ts
type Task = {
  id: number;
  text: string;
  done: boolean;
};

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`http://localhost:5000${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    // Try to parse JSON error from server for better message
    try {
      const errBody = (await res.json()) as { error?: string };
      const message = errBody?.error || `API error: ${res.status}`;
      throw new Error(message);
    } catch {
      throw new Error(`API error: ${res.status}`);
    }
  }

  return res.json() as Promise<T>;
}

const API = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: object) =>
    request<T>(url, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: <T>(url: string, body: object) =>
    request<T>(url, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T>(url: string) =>
    request<T>(url, {
      method: "DELETE",
    }),
};

export type { Task };
export default API;
