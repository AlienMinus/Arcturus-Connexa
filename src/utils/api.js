const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || '/api';

export const buildApiUrl = (path) => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
