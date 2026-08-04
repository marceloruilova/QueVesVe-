import { FeedItem } from '../services/api';

export type RootStackParamList = {
  Main: undefined;
  CreatePost: undefined;
  Record: undefined;
  UploadVideo: { videoUri: string };
  UploadMultipleVideos: { videoUris: string[] };
  UserProfile: { userId: number };
  VideoViewer:
    | { userId: number; startIndex: number }
    | { videos: FeedItem[]; startIndex: number }
    | { videoId: number };
  EditProfile: undefined;
  Conversation: { conversationId: number; otherUsername: string; otherUserId: number };
  FollowList: { userId: number; type: 'followers' | 'following'; title: string };
  Legal: { tab?: 'terms' | 'privacy' | 'community' };
  DeleteAccount: undefined;
};
