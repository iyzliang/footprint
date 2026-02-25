import client from './client';

export interface Project {
  id: string;
  name: string;
  appId: string;
  appSecret: string;
  domainWhitelist: string[];
  settings: Record<string, unknown>;
  dataRetentionDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectParams {
  name: string;
}

export async function getProjects(): Promise<Project[]> {
  const { data } = await client.get<Project[]>('/projects');
  return data;
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await client.get<Project>(`/projects/${id}`);
  return data;
}

export async function createProject(params: CreateProjectParams): Promise<Project> {
  const { data } = await client.post<Project>('/projects', params);
  return data;
}

export async function updateProject(id: string, params: Partial<Project>): Promise<Project> {
  const { data } = await client.put<Project>(`/projects/${id}`, params);
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  await client.delete(`/projects/${id}`);
}

export async function regenerateAppSecret(id: string): Promise<{ appSecret: string }> {
  const { data } = await client.post<{ appSecret: string }>(`/projects/${id}/regenerate-secret`);
  return data;
}
