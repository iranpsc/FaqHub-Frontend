type AvatarUser = {
  image_url?: string | null;
  image?: string | null;
};

function apiOrigin(): string {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  if (apiUrl && apiUrl !== '/api' && !apiUrl.startsWith('/')) {
    return apiUrl.replace(/\/api$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'https://api.faqhub.ir';
}

/**
 * Prefer the public avatar URL, then the raw image field some endpoints still send.
 */
export function userAvatarSrc(user?: AvatarUser | null): string | undefined {
  const candidate = user?.image_url || user?.image;
  if (typeof candidate !== 'string') {
    return undefined;
  }

  const trimmed = candidate.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * Turn stored avatar values into a URL the image component can load.
 * Accepts absolute URLs and public-disk paths such as avatars/photo.jpg.
 */
export function resolveAvatarSrc(imageSrc?: string | null): string | null {
  if (!imageSrc || imageSrc.trim() === '') {
    return null;
  }

  const src = imageSrc.trim();

  if (
    src.startsWith('data:') ||
    src.startsWith('blob:') ||
    /^https?:\/\//i.test(src)
  ) {
    return src;
  }

  if (src.startsWith('//')) {
    return `https:${src}`;
  }

  let path = src.replace(/^\/+/, '');
  if (path.startsWith('storage/')) {
    path = path.slice('storage/'.length);
  }

  if (!path || path.includes('..') || path.includes('\\')) {
    return null;
  }

  const storagePath = `/storage/${path}`;
  const origin = apiOrigin();

  return origin ? `${origin}${storagePath}` : storagePath;
}
