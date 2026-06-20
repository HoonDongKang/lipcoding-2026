export class Task {
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
