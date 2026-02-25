import client from './client';

export interface EventItem {
  id: string;
  eventName: string;
  properties: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  userId: string;
  anonymousId: string;
  pageUrl: string;
  pageTitle: string;
  referrer: string;
  userAgent: string;
  screenResolution: string;
  language: string;
  ip: string;
  country: string;
  city: string;
  createdAt: string;
}

export interface EventListResponse {
  items: EventItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getEvents(params: {
  projectId: string;
  eventName?: string;
  userId?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}): Promise<EventListResponse> {
  const { data } = await client.get<EventListResponse>('/events', { params });
  return data;
}

export async function getEventDetail(id: string): Promise<EventItem> {
  const { data } = await client.get<EventItem>(`/events/${id}`);
  return data;
}

export async function getEventNames(projectId: string): Promise<string[]> {
  const { data } = await client.get<string[]>('/events/names', { params: { projectId } });
  return data;
}

export function getExportUrl(params: {
  projectId: string;
  eventName?: string;
  userId?: string;
  startTime?: string;
  endTime?: string;
}): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  return `/api/events/export?${searchParams.toString()}`;
}
