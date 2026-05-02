const jwt = require('jsonwebtoken');

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      req.user = decoded; // { userId, role }

      if (roles.length > 0 && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Accès non autorisé.' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token invalide ou expiré.' });
    }
  };
};

module.exports = authMiddleware;
