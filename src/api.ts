// src/api.ts
export type Task = {
  id: number;
  title: string;
  completed: boolean;
  created_at?: string;
};

const API_ROOT = "/api/tasks";

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch(API_ROOT);
  if (!res.ok) throw new Error("Fetch tasks failed");
  return res.json();
}

export async function createTask(title: string): Promise<Task> {
  const res = await fetch(API_ROOT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function updateTask(
  task: Partial<Task> & { id: number }
): Promise<Task> {
  const res = await fetch(`${API_ROOT}/${task.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  return res.json();
}

export async function deleteTask(id: number): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API_ROOT}/${id}`, { method: "DELETE" });
  return res.json();
}
