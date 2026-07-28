export class UploadRejectedError extends Error {
  constructor(
    message: string,
    public readonly reason: 'quota_exceeded' | 'duration_exceeded' | 'file_too_large' | 'other',
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'UploadRejectedError';
  }
}
