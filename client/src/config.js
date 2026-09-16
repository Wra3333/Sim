export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const UPLOADS_URL = '/uploads';

export const getUploadsUrl = (filename) => {
  if (!filename) return '';
  if (String(filename).startsWith('http')) return filename;
  const clean = String(filename).replace(/^\/+/, '');
  return `${UPLOADS_URL}/${clean}`;
};

export const getPhotoUrl = (photo) => getUploadsUrl(photo);

export const getAdditionalFileUrl = (filename) => {
  if (!filename) return '';
  if (String(filename).startsWith('http')) return filename;
  const clean = String(filename).replace(/^\/+/, '');
  return `${UPLOADS_URL}/additional/${clean}`;
};