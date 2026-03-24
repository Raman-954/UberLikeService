import express from 'express';
import { body } from 'express-validator';
import {
  requestRide,
  getAvailableDrivers,
  acceptRide,
  rejectRide,
  getUserCurrentRide,
  getDriverPendingRides,
  getDriverCurrentRide,
  startRide,
  verifyOtp,
  completeRide,
  confirmPaymentReceived,
  setDriverAvailability,
  rateRide,
  cancelRide, 
  payPenalty,


} from '../controllers/ridesController.js';
import { requireAuth,checkPenalty } from '../middlewares/authMiddleware.js';

const router = express.Router();

/* ---------------- REQUEST RIDE ---------------- */
router.post(
  '/request',
  requireAuth,
  checkPenalty,
  [
    body('pickupLocation.address').notEmpty(),
    body('pickupLocation.coordinates.latitude').isNumeric(),
    body('pickupLocation.coordinates.longitude').isNumeric(),
    body('dropLocation.address').notEmpty(),
    body('dropLocation.coordinates.latitude').isNumeric(),
    body('dropLocation.coordinates.longitude').isNumeric(),
    body('vehicleType').isIn(['economy', 'comfort', 'premium', 'xl', 'suv']),
    body('distance').isNumeric(),
    body('duration').isNumeric()
  ],
  requestRide
);

/* ---------------- AVAILABLE DRIVERS ---------------- */
router.get('/available-drivers', requireAuth, getAvailableDrivers);

/* ---------------- LIFECYCLE (driver) ---------------- */
router.post('/:rideId/accept', requireAuth, checkPenalty,acceptRide);
router.post('/:rideId/reject', requireAuth, rejectRide);
router.post('/:rideId/start', requireAuth, startRide);
router.post('/:rideId/verify-otp', requireAuth, verifyOtp);
router.post('/:rideId/complete', requireAuth, completeRide);
router.post('/:rideId/payment-received', requireAuth, confirmPaymentReceived);
router.post('/driver/availability', requireAuth, setDriverAvailability);
router.post('/:rideId/rate', requireAuth, rateRide);
router.post('/:rideId/cancel', requireAuth, cancelRide);
router.post('/pay-penalty', requireAuth, payPenalty);

/* ---------------- CURRENT RIDES ---------------- */
router.get('/user/current', requireAuth, getUserCurrentRide);
router.get('/driver/pending', requireAuth, getDriverPendingRides);
router.get('/driver/current', requireAuth, getDriverCurrentRide);

export default router;
