export type RootStackParamList = {
  Main: undefined;
  Record: undefined;
  UploadVideo: { videoUri: string };
  UserProfile: { userId: number };
  VideoViewer: { userId: number; startIndex: number };
  EditProfile: undefined;
  Conversation: { conversationId: number; otherUsername: string; otherUserId: number };
  FollowList: { userId: number; type: 'followers' | 'following'; title: string };
  Legal: { tab?: 'terms' | 'privacy' | 'community' };
  DeleteAccount: undefined;
};
