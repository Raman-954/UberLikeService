# Ride Booking System - Setup Guide

## ✅ What's Been Implemented

A fully functional ride booking system with real-time monitoring using Socket.io:

1. **Trip Booking Page** - Users select pickup/drop locations
2. **Available Drivers Page** - Shows available drivers after clicking "Search rides"
3. **Ride Status Page** - Real-time tracking of ride status (pending → accepted → started)
4. **Driver Dashboard** - Real-time ride request notifications
5. **Socket.io Integration** - Live updates between users and drivers

## 🚀 Quick Start

### 1. Start the Backend Server
```bash
cd server
npm install  # If not already done
npm start    # or npm run dev for development
```

The server will automatically seed test drivers on startup!

### 2. Start the Frontend
```bash
# In the root directory
npm install  # If not already done
npm run dev
```

### 3. Test Accounts

**Test Drivers (Auto-seeded):**
- Email: `rajesh.driver@sawari.com` | Password: `Driver@123` (Economy)
- Email: `amit.driver@sawari.com` | Password: `Driver@123` (Comfort)
- Email: `vikram.driver@sawari.com` | Password: `Driver@123` (Premium)
- Email: `suresh.driver@sawari.com` | Password: `Driver@123` (XL)
- Email: `mohammed.driver@sawari.com` | Password: `Driver@123` (Economy)

**Create a User Account:**
- Go to `/signup/user` and create a user account
- Or use any email to sign up as a regular user

## 📱 How to Use

### For Users:
1. Login/Signup as a user
2. Go to `/trip` page
3. Enter pickup and drop locations
4. Select vehicle type
5. Click "Search rides"
6. You'll see available drivers
7. Click "Request Ride" on any driver
8. You'll be redirected to ride status page
9. Wait for driver to accept → See "Ride Accepted"
10. Driver starts ride → See "Ride Has Started"

### For Drivers:
1. Login as a driver (use test accounts above)
2. Go to `/driver/dashboard`
3. You'll see real-time ride requests appear automatically
4. Click "Accept Ride" when a request comes
5. Click "Start Ride" when you pick up the passenger
6. Click "Complete Ride" when you drop them off

## 🔧 Manual Driver Seeding (Optional)

If you need to seed drivers manually:
```bash
cd server
npm run seed-drivers
```

## 🐛 Troubleshooting

### Blank Page on `/available-drivers`
- Make sure you're logged in as a user (not driver)
- Make sure you navigated from `/trip` page with locations selected
- Check browser console for errors
- Ensure backend server is running on port 5000

### No Drivers Showing
- Check if MongoDB is running
- Verify drivers were seeded (check server console logs)
- Ensure drivers have `isAvailable: true` in database

### Socket.io Not Working
- Ensure backend server is running
- Check browser console for socket connection errors
- Verify CORS settings in server.js

## 📊 Features

✅ Real-time ride requests via Socket.io
✅ Live status updates (pending → accepted → started)
✅ Driver availability management
✅ Multiple vehicle types (economy, comfort, premium, xl)
✅ Automatic driver seeding on server start
✅ Clean, modern UI
✅ Error handling and graceful degradation

## 🎯 Next Steps (Optional Enhancements)

- Add ride cancellation
- Add driver location tracking
- Add payment integration
- Add ride history
- Add ratings and reviews
- Add push notifications
