# Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
cd ..
```

### 2. Setup MongoDB

**Option A: Local MongoDB**
- Make sure MongoDB is installed and running
- Default connection: `mongodb://localhost:27017/sawari`

**Option B: MongoDB Atlas (Cloud)**
- Create a free account at https://www.mongodb.com/cloud/atlas
- Get your connection string
- Update `server/.env` with your Atlas URI

### 3. Create Environment File

Create `server/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sawari
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Testing the Application

### Test User Flow:
1. Go to http://localhost:5173
2. Click "Sign up as User"
3. Fill in the form and create account
4. You'll be redirected to trip booking page
5. Enter pickup and dropoff locations
6. Select vehicle type and click "Search"
7. Request a ride from available drivers

### Test Driver Flow:
1. Open a new incognito/private window
2. Go to http://localhost:5173
3. Click "Sign up as Driver"
4. Fill in the form with vehicle details
5. You'll be redirected to driver dashboard
6. Accept ride requests and manage rides

## Common Issues

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` (Windows) or `sudo systemctl start mongod` (Linux/Mac)
- Check your connection string in `server/.env`

### Port Already in Use
- Change PORT in `server/.env` to a different port (e.g., 5001)
- Update API_URL in `src/utils/api.js` to match

### CORS Errors
- Ensure backend is running before frontend
- Check CORS settings in `server/server.js`

### Map Not Loading
- Verify Mapbox token in `src/pages/TripBooking.jsx`
- Check browser console for errors

## Project Structure Overview

```
sawari/
├── server/              # Backend (Express + MongoDB)
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   └── server.js      # Server entry point
├── src/               # Frontend (React)
│   ├── pages/        # Page components
│   ├── utils/        # Utilities
│   └── App.jsx       # Main app
└── package.json      # Frontend dependencies
```

## Next Steps

1. Create test accounts (user and driver)
2. Test the complete ride flow
3. Check dashboards for statistics
4. Explore the code to understand the structure

Happy coding! 🚀

