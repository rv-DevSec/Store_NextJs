const uploadsBase = process.env.NEXT_PUBLIC_UPLOADS_URL || '';

export const toAbsoluteUploadUrl = (url: string | undefined | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/') && uploadsBase) {
    return `${uploadsBase}${url}`;
  }
  return url;
};
