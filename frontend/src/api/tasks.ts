export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  aiGenerated: boolean;
  githubIssueUrl?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  date: string;
  priority?: 'low' | 'medium' | 'high';
  aiGenerated?: boolean;
  githubIssueUrl?: string;
  parentId?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  date?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  aiGenerated?: boolean;
  githubIssueUrl?: string;
  parentId?: string;
}

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/tasks`
  : '/api/tasks';

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

export const tasksApi = {
  getByDate: (date: string): Promise<Task[]> =>
    request<Task[]>(`${API_BASE}?date=${encodeURIComponent(date)}`),

  create: (payload: CreateTaskPayload): Promise<Task> =>
    request<Task>(API_BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateTaskPayload): Promise<Task> =>
    request<Task>(`${API_BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  remove: (id: string): Promise<void> =>
    request<void>(`${API_BASE}/${id}`, { method: 'DELETE' }),
};
