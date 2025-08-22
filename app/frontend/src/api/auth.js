import axios from "./axiosConfig";

export const login = async (username, password) => {
  return axios.post("/login", { username, password });
};

export const logout = async () => {
  return axios.post("/logout");
};

export const getDashboard = async () => {
  return axios.get("/dashboard");
};
