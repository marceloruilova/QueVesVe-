import { API_BASE_URL } from '../config/api';

export interface User {
  id: number;
  username: string;
  email: string;
  bio: string;
  profile_picture: string | null;
}

export interface LoginResponse {
  refresh: string;
  access: string;
}

export interface RegisterResponse {
  user: User;
  refresh: string;
  access: string;
}

export async function loginUser(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/users/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE_URL}/users/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.username?.[0] || data?.email?.[0] || 'Registration failed');
  return data;
}

export async function getUserProfile(
  userId: number,
  accessToken: string,
): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}

export interface FeedItem {
  id: number;
  username: string;
  profile_picture: string | null;
  tags: string;
  music: string;
  likes: number;
  comments: number;
  uri: string;
}

export async function getFeed(accessToken: string): Promise<FeedItem[]> {
  const res = await fetch(`${API_BASE_URL}/videos/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch feed');
  return res.json();
}

export async function uploadVideo(
  videoUri: string,
  description: string,
  tags: string,
  music: string,
  accessToken: string,
): Promise<void> {
  const formData = new FormData();
  formData.append('video_file', {
    uri: videoUri,
    name: 'video.mp4',
    type: 'video/mp4',
  } as unknown as Blob);
  formData.append('description', description);
  formData.append('tags', tags);
  formData.append('music', music);

  const res = await fetch(`${API_BASE_URL}/videos/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload video');
}

export function decodeJWT(token: string): { user_id: number; [key: string]: unknown } {
  const payload = token.split('.')[1];
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded);
}
