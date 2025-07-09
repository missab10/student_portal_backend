const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token missing or invalid' });
    }
    

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.isAdmin) {
      return res.status(403).json({ message: 'Access denied: Admins not allowed' });
    }

    req.student = decoded; // Attach student info
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Student authentication failed' });
  }
};
