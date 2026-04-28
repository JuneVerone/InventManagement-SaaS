import api from './axios'

export const getAlertsApi = () =>
  api.get('/alerts').then(res => res.data.data)

export const resolveAlertApi = (id) =>
  api.patch(`/alerts/${id}/resolve`).then(res => res.data.data)

export const resolveAllAlertsApi = () =>
  api.patch('/alerts/resolve-all').then(res => res.data)