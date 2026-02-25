import client from './client';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  nickname?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export async function login(params: LoginParams): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/auth/login', params);
  return data;
}

export async function register(params: RegisterParams): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/auth/register', params);
  return data;
}

export async function refreshToken(token: string): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/auth/refresh', { refreshToken: token });
  return data;
}
