import api from './axios'

export async function applySeller(data) {
  const response = await api.post('/users/me/seller-application', data)
  return response.data.data.user
}
