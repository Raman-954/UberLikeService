import express from 'express';
import Ride from '../models/Ride.js';
import Driver from '../models/Driver.js';
import User from '../models/User.js';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// User Dashboard
router.get('/user', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (user.userType !== 'user') {
      return res.status(403).json({ message: 'Only users can access user dashboard' });
    }

    // Get all completed rides
    const completedRides = await Ride.find({
      userId: req.session.userId,
      status: 'ended'
    }).populate('driverId').sort({ completedAt: -1 });

    // Calculate total spent
    const totalSpent = completedRides.reduce((sum, ride) => sum + ride.fare, 0);

    // Get total rides count
    const totalRides = completedRides.length;

    res.json({  
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        penaltyDue: user.penaltyDue
      },
      stats: {
        totalRides,
        totalSpent
      },
      recentRides: completedRides.slice(0, 10) // Last 10 rides
    });
  } catch (error) {
    console.error('User dashboard error:', error);
    res.status(500).json({ message: 'Server error while fetching user dashboard' });
  }
});

// Driver Dashboard
router.get('/driver', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (user.userType !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can access driver dashboard' });
    }

    const driver = await Driver.findOne({ userId: req.session.userId });
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    // Get all completed rides
    const completedRides = await Ride.find({
      driverId: driver._id,
      status: 'ended'
    }).populate('userId', 'name phone').sort({ completedAt: -1 });

    res.json({
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      driver: {
        vehicleType: driver.vehicleType,
        penaltyDue: driver.penaltyDue,
        vehicleModel: driver.vehicleModel,
        vehicleNumber: driver.vehicleNumber,
        rating: driver.rating,
        isAvailable: driver.isAvailable
      },
      stats: {
        totalRides: driver.totalRides,
        totalEarnings: driver.totalEarnings
      },
      recentRides: completedRides.slice(0, 10) // Last 10 rides
    });
  } catch (error) {
    console.error('Driver dashboard error:', error);
    res.status(500).json({ message: 'Server error while fetching driver dashboard' });
  }
});


// Admin Dashboard - global stats
router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [userCount, driverCount, totalEarningsAgg] = await Promise.all([
      User.countDocuments({ userType: 'user' }),
      User.countDocuments({ userType: 'driver' }),
      Driver.aggregate([
        { $group: { _id: null, total: { $sum: '$totalEarnings' } } }
      ])
    ]);

    const totalEarnings =
      totalEarningsAgg.length > 0 ? totalEarningsAgg[0].total : 0;

    res.json({
      admin: {
        name: req.currentUser.name,
        email: req.currentUser.email
      },
      stats: {
        totalUsers: userCount,
        totalDrivers: driverCount,
        totalEarnings
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error while fetching admin stats' });
  }
});

// List all drivers
router.get('/admin/drivers', requireAuth, requireAdmin, async (req, res) => {
  try {
    const drivers = await Driver.find({}).populate('userId', 'name email phone');

    res.json({
      drivers: drivers.map((d) => ({
        id: d._id,
        userId: d.userId._id,
        name: d.userId.name,
        email: d.userId.email,
        phone: d.userId.phone,
        vehicleType: d.vehicleType,
        vehicleModel: d.vehicleModel,
        vehicleNumber: d.vehicleNumber,
        totalRides: d.totalRides,
        totalEarnings: d.totalEarnings
      }))
    });
  } catch (error) {
    console.error('Admin drivers list error:', error);
    res.status(500).json({ message: 'Server error while fetching drivers' });
  }
});

// Delete a driver (and linked user)
router.delete('/admin/drivers/:driverId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const userId = driver.userId;

    await Driver.deleteOne({ _id: driver._id });
    await User.deleteOne({ _id: userId });

    // Optionally, adjust rides for this driver here (e.g., mark as cancelled)

    res.json({ message: 'Driver and linked user deleted successfully' });
  } catch (error) {
    console.error('Admin delete driver error:', error);
    res.status(500).json({ message: 'Server error while deleting driver' });
  }
});

export default router;

