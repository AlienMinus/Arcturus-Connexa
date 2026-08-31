export const getUserFullName = (user, fallback = 'Anonymous') => {
  if (!user) return fallback;
  if (typeof user === 'string') return user;
  const parts = [user.firstName, user.middleName, user.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return user.name || user.username || fallback;
};

