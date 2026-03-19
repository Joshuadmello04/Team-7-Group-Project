import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080"
});

// ── Auth ──────────────────────────────────────────
export const registerUser    = (data) => API.post("/auth/register/user", data);
export const registerCompany = (data) => API.post("/auth/register/company", data);
export const loginUser       = (data) => API.post("/auth/login", data);

export const changeUsername = (username, newUsername, password) =>
  API.post(`/auth/change-username?username=${username}&newUsername=${encodeURIComponent(newUsername)}&password=${encodeURIComponent(password)}`);

export const changePassword = (username, oldPassword, newPassword) =>
  API.post(`/auth/change-password?username=${username}&oldPassword=${encodeURIComponent(oldPassword)}&newPassword=${encodeURIComponent(newPassword)}`);

// ── Shares ────────────────────────────────────────
export const createShare       = (data, username) => API.post(`/shares/create?username=${username}`, data);
export const getCompanyShares  = (username)        => API.get(`/shares/company?username=${username}`);
export const getApprovedShares = ()                => API.get("/shares/approved");
export const getAllShares       = ()                => API.get("/shares/all");
export const approveShare      = (id)              => API.put(`/shares/approve/${id}`);

// ── Wallet ────────────────────────────────────────
export const getWallet = (username)         => API.get(`/trade/wallet?username=${username}`);
export const addMoney  = (username, amount) => API.post(`/trade/wallet/add?username=${username}&amount=${amount}`);

// ── Trade ─────────────────────────────────────────
export const buyShare  = (username, companyName, quantity) => API.post("/trade/buy",  { username, companyName, quantity });
export const sellShare = (username, companyName, quantity) => API.post("/trade/sell", { username, companyName, quantity });

// ── Portfolio ─────────────────────────────────────
export const getPortfolio    = (username) => API.get(`/trade/portfolio?username=${username}`);
export const getTransactions = (username) => API.get(`/trade/transactions?username=${username}`);

// ── Orders ────────────────────────────────────────
export const getUserOrders = (username) =>
  API.get(`/trade/orders?username=${username}`);

export const placeLimitBuy = (username, companyName, targetPrice, quantity, expiresInHours = 24) =>
  API.post(`/trade/orders/limit-buy?username=${username}&companyName=${encodeURIComponent(companyName)}&targetPrice=${targetPrice}&quantity=${quantity}&expiresInHours=${expiresInHours}`);

export const placeStopLoss = (username, companyName, targetPrice, quantity, expiresInHours = 0) =>
  API.post(`/trade/orders/stop-loss?username=${username}&companyName=${encodeURIComponent(companyName)}&targetPrice=${targetPrice}&quantity=${quantity}&expiresInHours=${expiresInHours}`);

export const cancelOrder = (id, username) =>
  API.delete(`/trade/orders/${id}?username=${username}`);