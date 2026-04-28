import api from './axios'

// POST /stock/adjust
export const adjustStockApi = (data) =>
  api.post('/stock/adjust', data).then(res => res.data.data)

// GET /stock/history/:productId
export const getStockHistoryApi = (productId) =>
  api.get(`/stock/history/${productId}`).then(res => res.data.data)