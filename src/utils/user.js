export const getUserFullName = (user, fallback = '') => {
  if (!user) return fallback;
  if (typeof user === 'string') return user.trim() || fallback;
  const parts = [user.firstName, user.middleName, user.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return user.name || user.username || user.author || fallback;
};
