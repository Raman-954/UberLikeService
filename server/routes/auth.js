import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Driver from '../models/Driver.js';

const router = express.Router();

// User Signup
router.post('/signup/user', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      userType: 'user'
    });

    await user.save();

    // Set session
    req.session.userId = user._id;
    req.session.userType = 'user';

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Driver Signup
router.post('/signup/driver', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit phone number'),
  body('vehicleType').isIn(['economy', 'comfort', 'premium', 'xl', 'suv']).withMessage('Invalid vehicle type'),
  body('vehicleModel').trim().notEmpty().withMessage('Vehicle model is required'),
  body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required'),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, vehicleType, vehicleModel, vehicleNumber, licenseNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      userType: 'driver'
    });

    await user.save();

    // Create driver profile
    const driver = new Driver({
      userId: user._id,
      vehicleType,
      vehicleModel,
      vehicleNumber,
      licenseNumber
    });

    await driver.save();

    // Set session
    req.session.userId = user._id;
    req.session.userType = 'driver';

    res.status(201).json({
      message: 'Driver registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      },
      driver: {
        vehicleType: driver.vehicleType,
        vehicleModel: driver.vehicleModel
      }
    });
  } catch (error) {
    console.error('Driver signup error:', error);
    res.status(500).json({ message: 'Server error during driver signup' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Set session
    req.session.userId = user._id;
    req.session.userType = user.userType;

    // Get driver info if driver
    let driverInfo = null;
    if (user.userType === 'driver') {
      driverInfo = await Driver.findOne({ userId: user._id });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      },
      driver: driverInfo
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Check authentication status
router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let driverInfo = null;
    if (user.userType === 'driver') {
      driverInfo = await Driver.findOne({ userId: user._id });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      },
      driver: driverInfo
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;


