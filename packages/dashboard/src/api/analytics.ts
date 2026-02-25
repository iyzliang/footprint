import client from './client';

export interface TrendQuery {
  projectId: string;
  eventNames: string[];
  startDate: string;
  endDate: string;
  granularity: 'hour' | 'day';
}

export interface TrendDataPoint {
  time: string;
  count: number;
  eventName: string;
}

export async function getTrend(params: TrendQuery): Promise<TrendDataPoint[]> {
  const { data } = await client.get<TrendDataPoint[]>('/analytics/trend', { params });
  return data;
}

export interface RealtimeData {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  minuteTrend: { minute: string; count: number }[];
}

export async function getRealtime(projectId: string): Promise<RealtimeData> {
  const { data } = await client.get<RealtimeData>('/analytics/realtime', { params: { projectId } });
  return data;
}

export interface TopEvent {
  eventName: string;
  count: number;
  userCount: number;
}

export async function getTopEvents(params: {
  projectId: string;
  startDate: string;
  endDate: string;
  limit?: number;
}): Promise<TopEvent[]> {
  const { data } = await client.get<TopEvent[]>('/analytics/top-events', { params });
  return data;
}

export interface FunnelStep {
  eventName: string;
  count: number;
  rate: number;
}

export async function getFunnel(params: {
  projectId: string;
  steps: string[];
  startDate: string;
  endDate: string;
  groupBy?: 'userId' | 'sessionId';
}): Promise<FunnelStep[]> {
  const { data } = await client.post<FunnelStep[]>('/analytics/funnel', params);
  return data;
}

export interface WebVitalsData {
  metric: string;
  avg: number;
  p75: number;
  p95: number;
  time: string;
}

export async function getWebVitals(params: {
  projectId: string;
  startDate: string;
  endDate: string;
  granularity?: 'hour' | 'day';
}): Promise<WebVitalsData[]> {
  const { data } = await client.get<WebVitalsData[]>('/analytics/web-vitals', { params });
  return data;
}

export interface PagePerformance {
  pageUrl: string;
  avgLoadTime: number;
  visitCount: number;
}

export async function getPagePerformance(params: {
  projectId: string;
  startDate: string;
  endDate: string;
  limit?: number;
}): Promise<PagePerformance[]> {
  const { data } = await client.get<PagePerformance[]>('/analytics/page-performance', { params });
  return data;
}

export interface ErrorAggregate {
  message: string;
  type: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
}

export async function getErrors(params: {
  projectId: string;
  startDate: string;
  endDate: string;
  type?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: ErrorAggregate[]; total: number }> {
  const { data } = await client.get<{ items: ErrorAggregate[]; total: number }>('/analytics/errors', { params });
  return data;
}

export interface ErrorDetail {
  id: string;
  message: string;
  stack: string;
  pageUrl: string;
  userId: string;
  userAgent: string;
  timestamp: number;
}

export async function getErrorDetail(params: {
  projectId: string;
  message: string;
  startDate: string;
  endDate: string;
}): Promise<{ summary: ErrorAggregate; events: ErrorDetail[] }> {
  const { data } = await client.get<{ summary: ErrorAggregate; events: ErrorDetail[] }>(
    `/analytics/errors/${encodeURIComponent(params.message)}`,
    { params: { projectId: params.projectId, startDate: params.startDate, endDate: params.endDate } },
  );
  return data;
}
