import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import rideRoutes from './routes/rides.js';
import dashboardRoutes from './routes/dashboard.js';
import Driver from './models/Driver.js';

dotenv.config();

const FRONTEND_URL = "https://sawari-frontend-xzui.onrender.com";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
cors: {
origin: FRONTEND_URL,
credentials: true
}
});

app.use(cors({
origin: FRONTEND_URL,
credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
res.send('Sawari Backend Running 🚕');
});

app.use(session({
secret: 'sawari-secret',
resave: false,
saveUninitialized: false
}));

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log(err));

app.use('/auth', authRoutes);
app.use('/rides', rideRoutes);
app.use('/dashboard', dashboardRoutes);

const userSockets = new Map();
const driverSockets = new Map();

io.on('connection', (socket) => {
console.log('Socket connected:', socket.id);

socket.on('user:connect', async ({ userId, userType }) => {
if (!userId) return;

```
socket.data.userId = userId;
socket.data.userType = userType;

userSockets.set(String(userId), socket.id);

if (userType === 'driver') {
  try {
    const driver = await Driver.findOne({ userId });

    if (driver) {
      driverSockets.set(String(driver._id), socket.id);
      socket.data.driverId = String(driver._id);
    }
  } catch (err) {
    console.error('Error mapping driver socket:', err);
  }
}
```

});

socket.on('ride:join', ({ rideId }) => {
if (!rideId) return;

```
const room = 'ride:' + rideId;
socket.join(room);
```

});

socket.on('driver:locationUpdate', async ({ rideId, location }) => {
if (!rideId || !location) return;

```
io.to('ride:' + rideId).emit('driver:location', { location });

if (socket.data.driverId) {
  try {
    await Driver.findByIdAndUpdate(socket.data.driverId, {
      currentLocation: location,
      lastLocationUpdate: new Date()
    });
  } catch (err) {
    console.error('Location update error:', err);
  }
}
```

});

socket.on('disconnect', () => {
for (const [key, value] of userSockets.entries()) {
if (value === socket.id) {
userSockets.delete(key);
}
}

```
for (const [key, value] of driverSockets.entries()) {
  if (value === socket.id) {
    driverSockets.delete(key);
  }
}
```

});
});

app.set('io', io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
console.log(`🚕 Sawari backend running on port ${PORT}`);
});
