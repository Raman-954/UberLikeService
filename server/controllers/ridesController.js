import { validationResult } from 'express-validator';
import Ride from '../models/Ride.js';
import Driver from '../models/Driver.js';
import User from '../models/User.js';

/* ---------------- Helpers ---------------- */

const calculateFare = (distance, vehicleType, surgeMultiplier = 1) => {
  const baseFare = { economy: 50, comfort: 80, premium: 120, xl: 100, suv: 150 };
  const perKmRate = { economy: 10, comfort: 15, premium: 25, xl: 20, suv: 30 };
  // Multiply total by surge
  return (baseFare[vehicleType] + distance * perKmRate[vehicleType]) * surgeMultiplier;
};

const haversineDistance = (coords1, coords2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(coords1.latitude)) * Math.cos(toRad(coords2.latitude)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};  

/* ---------------- Controllers ---------------- */

export const requestRide = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const user = await User.findById(req.session.userId);
    if (!user || user.userType !== 'user') return res.status(403).json({ message: 'Only users can request rides' });

    const { pickupLocation, dropLocation, vehicleType, distance, duration } = req.body;

    /* 1. SURGE PRICING LOGIC */
    const demand = await Ride.countDocuments({ status: { $in: ['requested', 'accepted', 'started'] } });
    const supply = await Driver.countDocuments({ isAvailable: true, vehicleType });
    
    let surgeMultiplier = 1;
    if (demand > supply && supply > 0) {
      surgeMultiplier = Math.min(2.0, 1 + ((demand - supply) * 0.15)); // Scales up to 2.0x
    } else if (supply === 0 && demand > 0) {
      surgeMultiplier = 2.0;
    }

    /* 2. SMART ETA LOGIC */
    let adjustedEta = duration;
    const hour = new Date().getHours();
    const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21);
    if (isPeak) {
      const trafficFactor = 1.3 + (Math.random() * 0.2); // 1.3 to 1.5 times slower
      adjustedEta = Math.ceil(duration * trafficFactor);
    }

    const ride = await Ride.create({
      userId: req.session.userId,
      pickupLocation,
      dropLocation,
      vehicleType,
      distance,
      originalEta: duration,
      adjustedEta: adjustedEta,
      duration: adjustedEta, // Use adjusted ETA
      surgeMultiplier,
      fare: Math.round(calculateFare(distance, vehicleType, surgeMultiplier)),
      status: 'requested'
    });

    const io = req.app.get('io');
    if (io) io.emit('ride:request', { ride });

    res.status(201).json({ message: 'Ride requested', ride });
  } catch (err) {
    console.error('Request ride error:', err);
    res.status(500).json({ message: 'Ride request failed' });
  }
};

export const getAvailableDrivers = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.userType !== 'user') {
      return res.status(403).json({ message: 'Only users can view drivers' });
    }

    const { vehicleType, latitude, longitude } = req.query;

    if (!vehicleType) {
      return res.status(400).json({ message: 'vehicleType is required' });
    }

    let drivers = await Driver.find({
      isAvailable: true,
      vehicleType
    }).populate('userId', 'name');


    // ADD MATCHING/SORTING BY NEAREST DISTANCE
    let formattedDrivers = drivers.map((driver) => {
      let distanceAway = null;
      if (latitude && longitude && driver.currentLocation) {
        distanceAway = haversineDistance(
          { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
          driver.currentLocation
        );
      }
      return {
        id: driver._id,
        name: driver.userId?.name || 'Driver',
        vehicleType: driver.vehicleType,
        vehicleModel: driver.vehicleModel,
        vehicleNumber: driver.vehicleNumber,
        rating: driver.rating || 4.5,
        totalRides: driver.totalRides || 0,
        distanceAway // Pass calculated distance to frontend
      };
    });

    if (latitude && longitude) {
      // Sort closest first
      formattedDrivers.sort((a, b) => (a.distanceAway || Infinity) - (b.distanceAway || Infinity));
    }

    res.json({ drivers: formattedDrivers });
  } catch (error) {
    console.error('Available drivers error:', error);
    res.status(500).json({ message: 'Failed to fetch available drivers' });
  }
};

export const acceptRide = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.userType !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can accept rides' });
    }

    const driver = await Driver.findOne({ userId: user._id });
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    // मिडिलवेयर ने पेनल्टी चेक कर ली है, अब बस उपलब्धता देखें
    if (!driver.isAvailable) {
      return res.status(400).json({ message: 'You are already on a ride or offline' });
    }

    const ride = await Ride.findById(req.params.rideId);
    if (!ride || ride.status !== 'requested') {
      return res.status(400).json({ message: 'Ride no longer available' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    ride.driverId = driver._id;
    ride.status = 'accepted';
    ride.acceptedAt = new Date();
    ride.startOTP = otp;
    ride.qrCodeData = `RIDE-${ride._id}`;
    await ride.save();

    driver.isAvailable = false;
    await driver.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`ride:${ride._id}`).emit('ride:accepted', { ride });
    }

    res.json({ message: 'Ride accepted', ride });
  } catch (err) {
    console.error('Accept ride error:', err);
    res.status(500).json({ message: 'Failed to accept ride' });
  }
};

export const rejectRide = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.userType !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can reject rides' });
    }

    const driver = await Driver.findOne({ userId: user._id });
    const ride = await Ride.findById(req.params.rideId);

    if (!ride || ride.status !== 'requested') {
      return res.status(400).json({ message: 'Ride not rejectable' });
    }

    ride.status = 'rejected';
    ride.rejectedAt = new Date();
    ride.rejectedBy = driver?._id || null;
    ride.rejectReason = req.body.reason || 'Driver unavailable';
    await ride.save();

    const io = req.app.get('io');
    io?.to(`ride:${ride._id}`).emit('ride:rejected', { ride });

    res.json({ message: 'Ride rejected', ride });
  } catch (err) {
    console.error('Reject ride error:', err);
    res.status(500).json({ message: 'Reject failed' });
  }
};

export const getUserCurrentRide = async (req, res) => {
  const ride = await Ride.findOne({
    userId: req.session.userId,
    status: { $in: ['requested', 'accepted', 'started', 'rejected'] }
  }).populate('driverId');
  res.json({ ride });
};

export const getDriverPendingRides = async (req, res) => {
  const driver = await Driver.findOne({ userId: req.session.userId });
  const rides = await Ride.find({
    status: 'requested',
    vehicleType: driver.vehicleType
  }).populate('userId', 'name phone');
  res.json({ rides });
};

export const getDriverCurrentRide = async (req, res) => {
  const driver = await Driver.findOne({ userId: req.session.userId });
  const ride = await Ride.findOne({
    driverId: driver._id,
    status: { $in: ['accepted', 'started'] }
  });
  res.json({ ride });
};

export const setDriverAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.userType !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can update availability' });
    }

    const driver = await Driver.findOne({ userId: user._id });
    if (!driver) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }

    const { isAvailable } = req.body;
    driver.isAvailable = Boolean(isAvailable);
    await driver.save();

    res.json({ message: 'Availability updated', driver });
  } catch (err) {
    console.error('Set availability error:', err);
    res.status(500).json({ message: 'Failed to update availability' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user || user.userType !== 'driver') return res.status(403).json({ message: 'Only drivers can verify OTP' });

    const ride = await Ride.findById(req.params.rideId);
    if (!ride || ride.status !== 'accepted') return res.status(400).json({ message: 'Invalid ride status' });

    if (ride.startOTP !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP. Please check with the user.' });
    }

    ride.otpVerified = true;
    ride.status = 'started';
    ride.startedAt = new Date();
    await ride.save();

    const io = req.app.get('io');
    io?.to(`ride:${ride._id}`).emit('ride:started', { ride });

    res.json({ message: 'OTP verified, ride started', ride });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};
export const startRide = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.userType !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can start rides' });
    }

    const driver = await Driver.findOne({ userId: user._id });
    const ride = await Ride.findById(req.params.rideId);

    if (!ride || String(ride.driverId) !== String(driver._id)) {
      return res.status(403).json({ message: 'Not your ride' });
    }

    if (ride.status !== 'accepted') {
      return res.status(400).json({ message: 'Ride cannot be started' });
    }

    ride.status = 'started';
    ride.startedAt = new Date();
    await ride.save();

    const io = req.app.get('io');
    io?.to(`ride:${ride._id}`).emit('ride:started', { ride });

    res.json({ message: 'Ride started', ride });
  } catch (err) {
    console.error('Start ride error:', err);
    res.status(500).json({ message: 'Start failed' });
  }
};

export const completeRide = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.userType !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can end rides' });
    }
     const { qrData } = req.body;
    if (!qrData) return res.status(400).json({ message: 'QR Code scan is required to complete the ride.' });

    const driver = await Driver.findOne({ userId: user._id });
    const ride = await Ride.findById(req.params.rideId);

    if (!ride || String(ride.driverId) !== String(driver._id)) {
      return res.status(403).json({ message: 'Not your ride' });
    }

    if (ride.status !== 'started') {
      return res.status(400).json({ message: 'Ride cannot be ended' });
    }

    ride.status = 'ended';
    ride.completedAt = new Date();
    ride.paymentReceived = true; 
    ride.paymentReceivedAt = new Date();
    await ride.save();

    driver.isAvailable = true;
    driver.totalRides += 1;
    driver.totalEarnings += ride.fare;
    await driver.save();

    const io = req.app.get('io');
    io?.to(`ride:${ride._id}`).emit('ride:ended', { ride });

    res.json({ message: 'Ride ended', ride });
  } catch (err) {
    console.error('Complete ride error:', err);
    res.status(500).json({ message: 'End ride failed' });
  }
};

 


export const confirmPaymentReceived = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user || user.userType !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can confirm payment' });
    }

    const driver = await Driver.findOne({ userId: user._id });
    const ride = await Ride.findById(req.params.rideId);

    if (!ride || String(ride.driverId) !== String(driver._id)) {
      return res.status(403).json({ message: 'Not your ride' });
    }

    if (ride.status !== 'ended') {
      return res.status(400).json({ message: 'Payment can only be confirmed after ride ends' });
    }

    ride.paymentReceived = true;
    ride.paymentReceivedAt = new Date();
    await ride.save();

    const io = req.app.get('io');
    io?.to(`ride:${ride._id}`).emit('payment:received', {
      rideId: ride._id,
      amount: ride.fare,
      paymentReceivedAt: ride.paymentReceivedAt
    });

    res.json({ message: 'Payment confirmed', ride });
  } catch (err) {
    console.error('Payment confirmation error:', err);
    res.status(500).json({ message: 'Payment confirmation failed' });
  }
};

// ADD THIS EXPORT AT THE BOTTOM OF THE FILE
export const rateRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride || ride.status !== 'ended') return res.status(400).json({ message: 'Ride not completed' });
    if (ride.rating) return res.status(400).json({ message: 'Ride already rated' });

    const { rating } = req.body;
    ride.rating = rating;
    await ride.save();

    // Update Driver Average
    const driver = await Driver.findById(ride.driverId);
    if (driver) {
      const currentTotal = driver.rating * driver.ratingCount;
      driver.ratingCount += 1;
      driver.rating = (currentTotal + rating) / driver.ratingCount;
      await driver.save();
    }

    res.json({ message: 'Ride rated successfully', ride });
  } catch (err) {
    console.error('Rating error:', err);
    res.status(500).json({ message: 'Failed to rate ride' });
  }
};

export const cancelRide = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const isDriver = user.userType === 'driver';

    // Populate driver to check their location and last update
    const ride = await Ride.findById(req.params.rideId).populate('driverId');
    if (!ride || ride.status === 'ended' || ride.status === 'cancelled') {
      return res.status(400).json({ message: 'Ride cannot be cancelled' });
    }

    let penalty = 0;
    const now = new Date();

    if (!isDriver) {
      /* =========================================
         USER CANCELLATION LOGIC
      ========================================= */
      if (ride.status === 'accepted') {
        const driver = ride.driverId;
        const timeSinceAccept = (now - new Date(ride.acceptedAt)) / 1000 / 60; // in minutes

        let driverDistance = 0;
        if (driver?.currentLocation?.latitude) {
          driverDistance = haversineDistance(
            ride.pickupLocation.coordinates,
            driver.currentLocation
          );
        }

        let isDriverStuck = false;
        if (driver?.lastLocationUpdate) {
          const timeSinceLastMove = (now - new Date(driver.lastLocationUpdate)) / 1000 / 60;
          if (timeSinceLastMove > 5) isDriverStuck = true; // Not moved in 5 mins
        }

        // Apply Logic Rules
        if (timeSinceAccept <= 3) {
          penalty = 0; // Rule 1: Grace period (3 mins)
        } else if (driverDistance > 3) {
          penalty = 0; // Rule 2: Driver is too far (> 3km)
        } else if (isDriverStuck) {
          penalty = 0; // Rule 2: Driver is not moving
        } else {
          penalty = 50; // Standard cancellation fee
        }

      } else if (ride.status === 'started') {
        // Rule 3: Distance-based penalty if ride started
        const driver = ride.driverId;
        let distanceCovered = 0;
        if (driver?.currentLocation?.latitude) {
          distanceCovered = haversineDistance(
            ride.pickupLocation.coordinates,
            driver.currentLocation
          );
        }
        // Base ₹50 + ₹15 per km covered
        penalty = Math.round(50 + (distanceCovered * 15));
      }
    } else {
      /* =========================================
         DRIVER CANCELLATION LOGIC
      ========================================= */
      if (ride.status === 'accepted' || ride.status === 'started') {
        const driver = await Driver.findOne({ userId: user._id });
        driver.cancellationCount += 1;
        
        penalty = 100;
        // Rule 4: Frequent cancellations increase penalty
        if (driver.cancellationCount > 3) {
          penalty += 50; 
        }
        await driver.save();
      }
    }

    // UPDATE RIDE
    ride.status = 'cancelled';
    ride.cancelledBy = isDriver ? 'driver' : 'user';
    ride.cancellationFee = penalty;
    ride.cancelledAt = now;
    ride.cancellationReason = req.body.reason || 'Cancelled by request';
    
    const driverIdToFree = ride.driverId ? ride.driverId._id : null;
    await ride.save();

    // APPLY PENALTY TO USER OR DRIVER
    if (penalty > 0) {
      if (isDriver) {
        const driverToPenalize = await Driver.findOne({ userId: user._id });
        driverToPenalize.penaltyDue += penalty;
        await driverToPenalize.save();
      } else {
        user.penaltyDue += penalty;
        await user.save();
      }
    }

    // FREE UP THE DRIVER
    if (driverIdToFree) {
      await Driver.findByIdAndUpdate(driverIdToFree, { isAvailable: true });
    }

    const io = req.app.get('io');
    io?.to(`ride:${ride._id}`).emit('ride:cancelled', { ride, cancelledBy: ride.cancelledBy });

    res.json({ message: 'Ride cancelled successfully', ride, penalty });
  } catch (err) {
    console.error('Cancel ride error:', err);
    res.status(500).json({ message: 'Failed to cancel ride' });
  }
};

export const payPenalty = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (user.userType === 'driver') {
      const driver = await Driver.findOne({ userId: user._id });
      driver.penaltyDue = 0;
      await driver.save();
    } else {
      user.penaltyDue = 0;
      await user.save();
    }
    res.json({ message: 'Penalty cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to pay penalty' });
  }
};
