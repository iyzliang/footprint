import client from './client';

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
}

export async function getProfile(): Promise<UserProfile> {
  const { data } = await client.get<UserProfile>('/user/profile');
  return data;
}

export async function updateProfile(params: { nickname?: string }): Promise<UserProfile> {
  const { data } = await client.put<UserProfile>('/user/profile', params);
  return data;
}

export async function updatePassword(params: {
  oldPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const { data } = await client.put<{ message: string }>('/user/password', params);
  return data;
}
