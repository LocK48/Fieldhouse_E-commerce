const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '')

async function request(method, path, options = {}) {
  const token = localStorage.getItem('fieldhouse-access-token')
  const headers = { ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  let body = options.data
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(body)
  }
  const response = await fetch(`${baseURL}${path}`, { method, headers, body, credentials: 'include' })
  const data = response.status === 204 ? null : await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data?.message || `Request failed (${response.status})`)
    error.response = { status: response.status, data }
    throw error
  }
  return { data }
}

const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, data, options = {}) => request('POST', path, { ...options, data }),
  patch: (path, data, options = {}) => request('PATCH', path, { ...options, data }),
  delete: (path, options) => request('DELETE', path, options),
}

export default api
