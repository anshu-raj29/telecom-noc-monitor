import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000
});

async function request(path, options = {}) {
  const response = await api.request({ url: path, ...options });
  return response.data;
}

export async function getDashboard({ advance = false } = {}) {
  return await request(`/dashboard${advance ? "?advance=1" : ""}`);
}

export async function getKpis() {
  return await request("/kpis");
}

export async function getAlerts() {
  return await request("/alerts");
}

export async function getNetworkHealth() {
  return await request("/network-health");
}

export async function getTower(towerId) {
  return await request(`/tower/${towerId}`);
}

export async function getMlOverview() {
  return await request("/ml/overview");
}
