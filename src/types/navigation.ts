export type RootStackParamList = {
  Main: undefined;
  Record: undefined;
  UploadVideo: { videoUri: string };
  UserProfile: { userId: number };
  EditProfile: undefined;
  Conversation: { conversationId: number; otherUsername: string; otherUserId: number };
};
