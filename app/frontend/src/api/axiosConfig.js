import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "/", // adjust to match your Flask backend
  withCredentials: true, // this is essential for session cookies
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;