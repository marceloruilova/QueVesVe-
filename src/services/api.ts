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
  birth_date: string | null;
  is_adult: boolean;
  email_verified: boolean;
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export class ChatBlockedError extends Error {
  constructor(message: string, public readonly reason: string) {
    super(message);
    this.name = 'ChatBlockedError';
  }
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

export async function socialAuth(
  provider: 'google' | 'facebook',
  token: string,
): Promise<RegisterResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/users/social-auth/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, token }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  let data: { error?: string; [key: string]: unknown };
  try {
    data = await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
  if (!res.ok) throw new Error(data?.error ?? 'Error con autenticación social.');
  return data as unknown as RegisterResponse;
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

export async function refreshAccessToken(refreshToken: string): Promise<{ access: string }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error('No se pudo renovar la sesión.');
  return res.json();
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
  let data: { username?: string[]; email?: string[]; password?: string[]; [key: string]: unknown };
  try {
    data = await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
  if (!res.ok) throw new Error(data?.password?.[0] || data?.username?.[0] || data?.email?.[0] || 'Registration failed');
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
  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch { /* ignore */ }
    throw new Error(`Error ${res.status} al cargar perfil: ${body || res.statusText}`);
  }
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
  description: string;
  tags: string;
  music: string;
  likes: number;
  comments: number;
  liked_by_user: boolean;
  uri: string | null;
  thumbnail_url: string | null;
  views_count: number | null;
  category: string;
  source_type: 'ugc' | 'pexels' | 'pixabay';
  author_name: string;
}

export interface UserSearchItem {
  id: number;
  username: string;
  profile_picture: string | null;
  followers_count: number;
  is_following: boolean;
}

export interface CommentItem {
  id: number;
  username: string;
  text: string;
  created_at: string;
}

export async function getFeed(accessToken: string, category?: string): Promise<FeedItem[]> {
  let res: Response;
  const url = category
    ? `${API_BASE_URL}/videos/?category=${encodeURIComponent(category)}`
    : `${API_BASE_URL}/videos/`;
  try {
    res = await fetch(url, {
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

export async function searchUsers(
  query: string,
  accessToken: string,
  offset = 0,
): Promise<UserSearchItem[]> {
  let res: Response;
  const params = new URLSearchParams({ offset: String(offset) });
  if (query.trim()) params.set('q', query.trim());
  try {
    res = await fetch(`${API_BASE_URL}/users/search/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error('Error al buscar usuarios');
  try {
    return await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
}

export async function searchVideos(query: string, accessToken: string): Promise<FeedItem[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/videos/search/?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error('Error al buscar videos');
  try {
    return await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
}

export async function getTopVideos(accessToken: string): Promise<FeedItem[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/videos/top/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error('Error al obtener top videos');
  try {
    return await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
}

export async function recordView(videoId: number, accessToken: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/videos/${videoId}/view/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // silently ignore view tracking errors
  }
}

// ─── Direct Messages ────────────────────────────────────────────────────────

export interface OtherParticipant {
  id: number;
  username: string;
  profile_picture: string | null;
}

export interface LastMessage {
  text: string;
  sender_id: number;
  created_at: string;
}

export interface ConversationItem {
  id: number;
  other_participant: OtherParticipant | null;
  last_message: LastMessage | null;
  unread_count: number;
  updated_at: string;
}

export interface MessageItem {
  id: number;
  sender_id: number;
  sender_username: string;
  text: string;
  created_at: string;
  is_read: boolean;
}

export async function getConversations(accessToken: string): Promise<ConversationItem[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/messages/conversations/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error('Error al cargar conversaciones.');
  return res.json();
}

export async function createOrGetConversation(
  recipientId: number,
  accessToken: string,
): Promise<ConversationItem> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/messages/conversations/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: recipientId }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; chat_blocked?: string };
    if (data.chat_blocked) {
      throw new ChatBlockedError(data.error ?? 'Chat no disponible.', data.chat_blocked);
    }
    throw new Error(data.error ?? 'Error al iniciar conversación.');
  }
  return res.json();
}

export async function getMessages(
  conversationId: number,
  accessToken: string,
): Promise<MessageItem[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}/messages/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error('Error al cargar mensajes.');
  return res.json();
}

export async function sendMessage(
  conversationId: number,
  text: string,
  accessToken: string,
): Promise<MessageItem> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}/messages/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; chat_blocked?: string };
    if (data.chat_blocked) {
      throw new ChatBlockedError(data.error ?? 'Chat no disponible.', data.chat_blocked);
    }
    throw new Error('Error al enviar mensaje.');
  }
  return res.json();
}

export async function markConversationRead(
  conversationId: number,
  accessToken: string,
): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}/read/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // silently ignore read tracking errors
  }
}

export async function getFollowList(
  userId: number,
  type: 'followers' | 'following',
  accessToken: string,
): Promise<UserSearchItem[]> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/users/${userId}/follow-list/?type=${type}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) throw new Error('Error al cargar la lista.');
  try {
    return await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
}

export async function resendVerificationEmail(accessToken: string): Promise<{ detail: string }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/users/resend-verification/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  let data: { detail?: string; [key: string]: unknown };
  try {
    data = await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
  if (!res.ok) throw new Error(data?.detail ?? 'Error al reenviar email.');
  return data as { detail: string };
}

export async function reportVideo(
  videoId: number,
  reason: string,
  details: string,
  accessToken: string,
): Promise<{ message: string }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/videos/${videoId}/report/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason, details }),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  let data: { message?: string; error?: string; [key: string]: unknown };
  try {
    data = await res.json();
  } catch {
    throw new Error('Error del servidor. Intentá de nuevo.');
  }
  if (!res.ok) throw new Error(data?.error ?? 'Error al enviar el reporte.');
  return data as { message: string };
}

export async function deleteAccount(userId: number, accessToken: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/users/${userId}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor.');
  }
  if (!res.ok) {
    let data: { error?: string } = {};
    try { data = await res.json(); } catch { /* ignore */ }
    throw new Error(data?.error ?? 'Error al eliminar la cuenta.');
  }
}

// ─── JWT ────────────────────────────────────────────────────────────────────

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
