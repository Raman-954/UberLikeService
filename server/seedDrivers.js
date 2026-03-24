import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Driver from './models/Driver.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sawari';

const drivers = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.driver@sawari.com',
    password: 'Driver@123',
    phone: '9876543210',
    vehicleType: 'economy',
    vehicleModel: 'Maruti Swift',
    vehicleNumber: 'DL01AB1234',
    licenseNumber: 'DL1234567890',
    rating: 4.5,
    totalRides: 150
  },
  {
    name: 'Amit Singh',
    email: 'amit.driver@sawari.com',
    password: 'Driver@123',
    phone: '9876543211',
    vehicleType: 'comfort',
    vehicleModel: 'Honda City',
    vehicleNumber: 'DL02CD5678',
    licenseNumber: 'DL2345678901',
    rating: 4.8,
    totalRides: 230
  },
  {
    name: 'Vikram Sharma',
    email: 'vikram.driver@sawari.com',
    password: 'Driver@123',
    phone: '9876543212',
    vehicleType: 'premium',
    vehicleModel: 'Toyota Camry',
    vehicleNumber: 'DL03EF9012',
    licenseNumber: 'DL3456789012',
    rating: 4.9,
    totalRides: 180
  },
  {
    name: 'Suresh Patel',
    email: 'suresh.driver@sawari.com',
    password: 'Driver@123',
    phone: '9876543213',
    vehicleType: 'xl',
    vehicleModel: 'Toyota Innova',
    vehicleNumber: 'DL04GH3456',
    licenseNumber: 'DL4567890123',
    rating: 4.6,
    totalRides: 200
  },
  {
    name: 'Mohammed Ali',
    email: 'mohammed.driver@sawari.com',
    password: 'Driver@123',
    phone: '9876543214',
    vehicleType: 'economy',
    vehicleModel: 'Hyundai i20',
    vehicleNumber: 'DL05IJ7890',
    licenseNumber: 'DL5678901234',
    rating: 4.7,
    totalRides: 175
  },
  {
    name: 'Ravi Verma',
    email: 'ravi.driver@sawari.com',
    password: 'Driver@123',
    phone: '9876543215',
    vehicleType: 'comfort',
    vehicleModel: 'Hyundai Creta',
    vehicleNumber: 'DL06KL1234',
    licenseNumber: 'DL6789012345',
    rating: 4.4,
    totalRides: 120
  }
];

async function seedDrivers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const driverData of drivers) {
      // Check if user already exists
      let user = await User.findOne({ email: driverData.email });
      
      if (!user) {
        // Create user
        const hashedPassword = await bcrypt.hash(driverData.password, 10);
        user = new User({
          name: driverData.name,
          email: driverData.email,
          password: hashedPassword,
          phone: driverData.phone,
          userType: 'driver'
        });
        await user.save();
        console.log(`Created user: ${driverData.name}`);
      }

      // Check if driver profile exists
      let driver = await Driver.findOne({ userId: user._id });
      
      if (!driver) {
        // Create driver profile
        driver = new Driver({
          userId: user._id,
          vehicleType: driverData.vehicleType,
          vehicleModel: driverData.vehicleModel,
          vehicleNumber: driverData.vehicleNumber,
          licenseNumber: driverData.licenseNumber,
          rating: driverData.rating,
          totalRides: driverData.totalRides,
          isAvailable: true
        });
        await driver.save();
        console.log(`Created driver profile: ${driverData.name} - ${driverData.vehicleModel}`);
      } else {
        // Update existing driver to be available
        driver.isAvailable = true;
        await driver.save();
        console.log(`Updated driver: ${driverData.name}`);
      }
    }

    console.log('\n✅ Driver seeding completed successfully!');
    console.log('All drivers are now available for rides.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding drivers:', error);
    process.exit(1);
  }
}

seedDrivers();
