import { API_BASE_URL } from '../config/api';

export interface User {
  id: number;
  username: string;
  email: string;
  bio: string;
  profile_picture: string | null;
  professional_title: string;
  professional_institution: string;
  senescyt_number: string;
  senescyt_verified: boolean;
  senescyt_verified_name: string;
  senescyt_verified_at: string | null;
  followers_count: number;
  following_count: number;
  is_following: boolean;
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
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/users/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  let data: { access?: string; refresh?: string; error?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
  if (!res.ok) throw new Error(data.error ?? 'Login failed');
  return data as LoginResponse;
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/users/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  let data: { username?: string[]; email?: string[]; [key: string]: unknown };
  try {
    data = await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
  if (!res.ok) throw new Error(data?.username?.[0] || data?.email?.[0] || 'Registration failed');
  return data as unknown as RegisterResponse;
}

export async function getUserProfile(
  userId: number,
  accessToken: string,
): Promise<User> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/users/${userId}/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error('Failed to fetch user profile');
  try {
    return await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
}

export interface FeedItem {
  id: number;
  user_id: number;
  username: string;
  profile_picture: string | null;
  tags: string;
  music: string;
  likes: number;
  comments: number;
  liked_by_user: boolean;
  uri: string | null;
  thumbnail_url: string | null;
}

export interface CommentItem {
  id: number;
  username: string;
  text: string;
  created_at: string;
}

export async function getFeed(accessToken: string): Promise<FeedItem[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/videos/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error('Failed to fetch feed');
  try {
    return await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
}

export async function getUserVideos(userId: number, accessToken: string): Promise<FeedItem[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/videos/?user_id=${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error('Failed to fetch user videos');
  try {
    return await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
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

export async function toggleLike(
  videoId: number,
  liked: boolean,
  accessToken: string,
): Promise<{ likes: number; liked_by_user: boolean }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/videos/${videoId}/like/`, {
      method: liked ? 'DELETE' : 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error('Failed to toggle like');
  try {
    return await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
}

export async function getComments(videoId: number, accessToken: string): Promise<CommentItem[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/videos/${videoId}/comments/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error('Failed to fetch comments');
  try {
    return await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
}

export async function postComment(
  videoId: number,
  text: string,
  accessToken: string,
): Promise<CommentItem> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/videos/${videoId}/comments/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error('Failed to post comment');
  try {
    return await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
}

export async function updateUserProfile(
  userId: number,
  data: FormData | Record<string, string>,
  accessToken: string,
): Promise<User> {
  const isFormData = data instanceof FormData;
  const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
  if (!isFormData) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/users/${userId}/`, {
      method: 'PUT',
      headers,
      body: isFormData ? data : JSON.stringify(data),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  let responseData: { data?: User; [key: string]: unknown };
  try {
    responseData = await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
  if (!res.ok) throw new Error(String(Object.values(responseData)[0]) ?? 'Error al actualizar perfil');
  return (responseData.data ?? responseData) as User;
}

export async function verifySenescyt(
  userId: number,
  cedula: string,
  numeroRegistroSenescyt: string,
  accessToken: string,
): Promise<{ detail: string; verified_name: string; title: string; institution: string }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/users/${userId}/verify-senescyt/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cedula, numeroRegistroSenescyt }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  let data: { detail?: string; error?: string; [key: string]: unknown };
  try {
    data = await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
  if (!res.ok) throw new Error(data.error ?? 'Error al verificar SENESCYT');
  return data as { detail: string; verified_name: string; title: string; institution: string };
}

export async function followUser(userId: number, accessToken: string): Promise<{ followers_count: number }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/users/${userId}/follow/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error('Error al seguir al usuario');
  try {
    return await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
}

export async function unfollowUser(userId: number, accessToken: string): Promise<{ followers_count: number }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/users/${userId}/follow/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error('Error al dejar de seguir');
  try {
    return await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
}

export function decodeJWT(token: string): { user_id: number; [key: string]: unknown } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');
    const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    throw new Error('Token inválido. Iniciá sesión de nuevo.');
  }
}
