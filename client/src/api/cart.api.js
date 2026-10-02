import api from './axios'

export async function getCart() {
  const response = await api.get('/cart')
  return response.data.data.cart
}

export async function addCartItem(item) {
  const response = await api.post('/cart/items', item)
  return response.data.data.cart
}

export async function updateCartItem(item) {
  const response = await api.patch('/cart/items', item)
  return response.data.data.cart
}

export async function removeCartItem(item) {
  const response = await api.delete('/cart/items', { data: item })
  return response.data.data.cart
}

export async function clearCart() {
  const response = await api.delete('/cart')
  return response.data.data.cart
}
