import api from "./axios";

export async function requestRegistrationOtp(data) {
  const response = await api.post("/auth/register/request-otp", data);
  return response.data.data;
}

export async function verifyRegistrationOtp(email, code) {
  const response = await api.post("/auth/register/verify-otp", { email, code });
  return response.data.data.user;
}

export async function login(email, password) {
  const response = await api.post("/auth/login", { email, password });
  const session = response.data.data;
  localStorage.setItem("fieldhouse-access-token", session.accessToken);
  localStorage.setItem("fieldhouse-refresh-token", session.refreshToken);
  return session.user;
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data.data.user;
}

export async function refreshSession() {
  const refreshToken = localStorage.getItem("fieldhouse-refresh-token");
  if (!refreshToken) throw new Error("Sign in to continue");
  const response = await api.post("/auth/refresh", { refreshToken });
  const session = response.data.data;
  localStorage.setItem("fieldhouse-access-token", session.accessToken);
  if (session.refreshToken)
    localStorage.setItem("fieldhouse-refresh-token", session.refreshToken);
  return session;
}

export async function logout() {
  const refreshToken = localStorage.getItem("fieldhouse-refresh-token");
  try {
    if (refreshToken) await api.post("/auth/logout", { refreshToken });
  } finally {
    localStorage.removeItem("fieldhouse-access-token");
    localStorage.removeItem("fieldhouse-refresh-token");
  }
}
