import axios from 'axios';

const API_URL = "https://sawari-backend-vxxo.onrender.com/api"
// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});
export default api;
