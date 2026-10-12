# 🚗 Sawari – Real-Time Ride Hailing System

A full-stack **MERN (MongoDB, Express, React, Node.js)** application that replicates core functionality of modern ride-hailing platforms like Uber.

This system allows users to book rides, drivers to accept requests, and enables real-time ride management with interactive maps.



## ✨ Key Features

### 👤 User Features

* User registration & secure login
* Book rides with pickup & drop locations
* Interactive map with route visualization (OpenStreetMap + Leaflet)
* Select vehicle type (Economy, Premium, XL, etc.)
* Real-time ride status tracking
* User dashboard with ride history & total spending



### 🚘 Driver Features

* Driver registration with vehicle details
* View and accept ride requests
* Start and complete rides
* Driver dashboard (earnings + completed rides)
* Real-time ride notifications



### ⚡ Core System Features

* Ride lifecycle management:

  ```
  requested → accepted → started → completed / cancelled
  ```
* Dynamic fare calculation based on distance & vehicle type
* Session-based authentication (secure login system)
* RESTful API architecture



## 🛠️ Tech Stack

### 🎨 Frontend

* React (Vite)
* React Router DOM
* Leaflet + OpenStreetMap (for maps)
* Axios
* Tailwind CSS / CSS3

### ⚙️ Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* Express Session (Authentication)
* Bcrypt (Password hashing)



## 📦 Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Raman-954/Real-Time-Ride-Hailing.git
cd sawari
```



### 2️⃣ Install Dependencies

Frontend:

```bash
npm install
```

Backend:

```bash
cd server
npm install
cd ..
```



### 3️⃣ Setup Environment Variables

Create `.env` inside `server/`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sawari
```



### 4️⃣ Start MongoDB

```bash
mongod
```



## ▶️ Run Application

### Start Backend

```bash
cd server
npm run dev
```



### Start Frontend

```bash
npm run dev
```



### 🌐 App URLs

* Frontend: http://localhost:5173
* Backend: http://localhost:5000



## 📁 Project Structure

```
sawari/
├── server/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
├── src/
│   ├── pages/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
└── package.json
```



## 🗄️ Database Schema

### User

* name, email, password, phone
* userType (user / driver)

### Driver

* vehicleType, vehicleModel
* licenseNumber
* isAvailable
* totalRides, totalEarnings

### Ride

* pickupLocation, dropLocation
* vehicleType
* status (requested → completed)
* fare, distance, duration



## 🔗 API Endpoints

### Auth

* POST `/api/auth/signup/user`
* POST `/api/auth/signup/driver`
* POST `/api/auth/login`
* POST `/api/auth/logout`
* GET `/api/auth/me`



### Rides

* POST `/api/rides/request`
* POST `/api/rides/:rideId/accept`
* POST `/api/rides/:rideId/start`
* POST `/api/rides/:rideId/complete`



### Dashboard

* GET `/api/dashboard/user`
* GET `/api/dashboard/driver`



## 📌 Usage

### User Flow

1. Sign up / login
2. Enter pickup & drop
3. Choose vehicle
4. Request ride
5. Track ride status



### Driver Flow

1. Register as driver
2. Accept ride request
3. Start → Complete ride
4. View earnings dashboard



## ⚠️ Important Notes

* Uses **OpenStreetMap (no API key required)**
* Session-based authentication (no JWT)
* Polling used for real-time updates



## 🚀 Future Enhancements

* Payment integration (Razorpay)
* Surge pricing
* Live chat (user ↔ driver)



## 📄 License

This project is for educational purposes.


