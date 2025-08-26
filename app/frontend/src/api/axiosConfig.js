import axios from "axios";

// Make sure API_BASE_URL is defined
export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
console.log("API_BASE_URL:", API_BASE_URL);


const axiosInstance = axios.create({
  baseURL: API_BASE_URL, // adjust to match Flask backend
  withCredentials: true, // this is essential for session cookies
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;