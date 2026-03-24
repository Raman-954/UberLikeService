import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },

  pickupLocation: {
    address: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },

  dropLocation: {
    address: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },

  vehicleType: {
    type: String,
    enum: ['economy', 'comfort', 'premium', 'xl', 'suv'],
    required: true
  },

  status: {
    type: String,
    enum: [
      'requested',
      'accepted',
      'rejected',
      'started',
      'ended',
      'cancelled'
    ],
    default: 'requested'
  },

  fare: { type: Number, default: 0 },
  distance: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
   surgeMultiplier: { type: Number, default: 1 },
  originalEta: { type: Number, default: 0 },
  adjustedEta: { type: Number, default: 0 },

  requestedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  cancelledBy: { type: String, enum: ['user', 'driver', null], default: null },
  cancellationFee: { type: Number, default: 0 },
  cancellationReason: { type: String, default: null },
  cancelledAt: { type: Date, default: null },
    startOTP: { type: String, default: null },
  otpVerified: { type: Boolean, default: false },
  qrCodeData: { type: String, default: null },

   rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  paymentReceived: {
    type: Boolean,
    default: false
  },
  paymentReceivedAt: {
    type: Date,
    default: null
  },

  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },

  rejectReason: {
    type: String,
    default: null
  }
});

export default mongoose.model('Ride', rideSchema);
