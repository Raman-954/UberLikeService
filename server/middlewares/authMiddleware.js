import User from '../models/User.js';
import Driver from '../models/Driver.js';

// 1. Basic session-based auth
export const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// 2. User type check factory
export const requireUserType = (type) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.session.userId);
      if (!user || user.userType !== type) {
        return res.status(403).json({ message: `${type} access only` });
      }
      req.currentUser = user;
      next();
    } catch (err) {
      console.error('User type check error:', err);
      res.status(500).json({ message: 'Server error checking permissions' });
    }
  };
};

// 3. Specific Role Exports (इन्हें एक्सपोर्ट करना जरूरी है)
export const requireUser = requireUserType('user');
export const requireDriver = requireUserType('driver');
export const requireAdmin = requireUserType('admin'); // <-- यह लाइन मिसिंग थी, अब ठीक है

// 4. Penalty Check Middleware
export const checkPenalty = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: 'Auth required' });

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    
    if (user.userType === 'driver') {
      const driver = await Driver.findOne({ userId: user._id });
      if (driver && (driver.penaltyDue || 0) > 0) {
        return res.status(403).json({ 
          message: `जुर्माना भरें: ₹${driver.penaltyDue}`, 
          penaltyDue: driver.penaltyDue 
        });
      }
    } else {
      if ((user.penaltyDue || 0) > 0) {
        return res.status(403).json({ 
          message: `जुर्माना भरें: ₹${user.penaltyDue}`, 
          penaltyDue: user.penaltyDue 
        });
      }
    }
    next();
  } catch (err) {
    console.error("Penalty Middleware Error:", err);
    res.status(500).json({ message: 'Server error checking penalty' });
  }
};