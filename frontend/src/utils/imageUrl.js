import { STORAGE_URL } from '../config';

/**
 * Resolve product/media URLs from the API, rewriting localhost paths for production.
 */
export function resolveImageUrl(url) {
  if (!url) return null;

  if (url.includes('cloudinary.com') || url.includes('picsum.photos')) {
    return url;
  }

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(url)) {
    try {
      const { pathname } = new URL(url);
      if (pathname.startsWith('/storage/')) {
        return `${STORAGE_URL}${pathname.slice('/storage'.length)}`;
      }
      return `${STORAGE_URL}${pathname}`;
    } catch {
      return url;
    }
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const cleaned = url.replace(/^\//, '');
  if (cleaned.startsWith('storage/')) {
    return `${STORAGE_URL}/${cleaned.slice('storage/'.length)}`;
  }

  return `${STORAGE_URL}/${cleaned}`;
}

export function resolveProductImage(product) {
  const url =
    product?.primary_image?.image_url ||
    product?.primary_image?.thumbnail_url ||
    product?.thumbnail ||
    product?.image_url;

  return resolveImageUrl(url);
}

export function resolveStoragePath(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return resolveImageUrl(path);
  }
  return resolveImageUrl(`/storage/${path.replace(/^\/?storage\//, '')}`);
}
