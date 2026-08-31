import User from '../models/User.js';

const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.userId).select('username email role isAdmin');
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const isArcturusAdmin =
      user.role === 'admin' ||
      user.isAdmin === true ||
      (user.username && user.username.toLowerCase() === 'arcturus_admin') ||
      (user.email && user.email.toLowerCase().includes('admin@arcturus'));

    if (!isArcturusAdmin) {
      return res.status(403).json({
        error: 'Access denied. You need Arcturus Admin privileges to perform this operation.',
      });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    console.error('Admin middleware authentication error:', err);
    res.status(500).json({ error: 'Internal server authorization error' });
  }
};

export default adminMiddleware;

