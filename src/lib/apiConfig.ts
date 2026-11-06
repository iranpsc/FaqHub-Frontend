const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

if (!publicApiUrl) {
  throw new Error('NEXT_PUBLIC_API_URL must be defined in the frontend environment.');
}

export const PUBLIC_API_URL = publicApiUrl;
export const SERVER_API_URL = process.env.SERVER_API_URL?.trim() || PUBLIC_API_URL;
