import api from './axios'

export const getWarehousesApi = () =>
  api.get('/warehouses').then(res => res.data.data)

export const createWarehouseApi = (data) =>
  api.post('/warehouses', data).then(res => res.data.data)

export const deleteWarehouseApi = (id) =>
  api.delete(`/warehouses/${id}`).then(res => res.data)