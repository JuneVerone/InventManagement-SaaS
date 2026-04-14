import api from './axios'

export const getCategoriesApi = () =>
  api.get('/categories').then(res => res.data.data)

export const createCategoryApi = (data) =>
  api.post('/categories', data).then(res => res.data.data)

export const deleteCategoryApi = (id) =>
  api.delete(`/categories/${id}`).then(res => res.data)