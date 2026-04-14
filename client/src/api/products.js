import api from './axios'

// GET /products?page=1&limit=20&search=widget&categoryId=abc
export const getProductsApi = (params = {}) =>
  api.get('/products', { params }).then(res => res.data)

// GET /products/:id
export const getProductApi = (id) =>
  api.get(`/products/${id}`).then(res => res.data.data)

// POST /products
export const createProductApi = (data) =>
  api.post('/products', data).then(res => res.data.data)

// PATCH /products/:id
export const updateProductApi = (id, data) =>
  api.patch(`/products/${id}`, data).then(res => res.data.data)

// DELETE /products/:id
export const deleteProductApi = (id) =>
  api.delete(`/products/${id}`).then(res => res.data)