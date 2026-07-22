export class UploadRejectedError extends Error {
  constructor(
    message: string,
    public readonly reason: 'quota_exceeded' | 'duration_exceeded' | 'other',
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'UploadRejectedError';
  }
}
