#!/bin/bash

echo "Starting Sawari Application..."
echo ""
echo "Starting Backend Server..."
cd server && npm start &
sleep 3
cd ..
echo ""
echo "Starting Frontend Server..."
npm run dev &
echo ""
echo "Both servers are starting..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"

