const baseURL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"
).replace(/\/$/, "");
let refreshInFlight;

async function request(method, path, options = {}, canRefresh = true) {
  const token = localStorage.getItem("fieldhouse-access-token");
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  let body = options.data;
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
  const response = await fetch(`${baseURL}${path}`, {
    method,
    headers,
    body,
    credentials: "include",
  });
  const data =
    response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    const isAuthEndpoint = [
      "/auth/login",
      "/auth/register",
      "/auth/register/request-otp",
      "/auth/register/verify-otp",
      "/auth/refresh",
      "/auth/logout",
    ].includes(path);
    const refreshToken = localStorage.getItem("fieldhouse-refresh-token");
    if (
      response.status === 401 &&
      canRefresh &&
      !isAuthEndpoint &&
      refreshToken
    ) {
      try {
        if (!refreshInFlight) {
          refreshInFlight = fetch(`${baseURL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ refreshToken }),
          })
            .then(async (refreshResponse) => {
              const refreshData = await refreshResponse
                .json()
                .catch(() => ({}));
              if (!refreshResponse.ok || !refreshData.data?.accessToken) {
                throw new Error(
                  refreshData.message || "Your session has expired",
                );
              }
              localStorage.setItem(
                "fieldhouse-access-token",
                refreshData.data.accessToken,
              );
              if (refreshData.data.refreshToken) {
                localStorage.setItem(
                  "fieldhouse-refresh-token",
                  refreshData.data.refreshToken,
                );
              }
            })
            .finally(() => {
              refreshInFlight = undefined;
            });
        }
        await refreshInFlight;
        return request(method, path, options, false);
      } catch {
        localStorage.removeItem("fieldhouse-access-token");
        localStorage.removeItem("fieldhouse-refresh-token");
      }
    }
    const error = new Error(
      data?.message || `Request failed (${response.status})`,
    );
    error.response = { status: response.status, data };
    throw error;
  }
  return { data };
}

const api = {
  get: (path, options) => request("GET", path, options),
  post: (path, data, options = {}) =>
    request("POST", path, { ...options, data }),
  patch: (path, data, options = {}) =>
    request("PATCH", path, { ...options, data }),
  delete: (path, options) => request("DELETE", path, options),
};

export default api;
