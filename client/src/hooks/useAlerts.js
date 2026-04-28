import { useState, useEffect, useCallback } from 'react'
import { getAlertsApi, resolveAlertApi, resolveAllAlertsApi } from '../api/alerts'

export const useAlerts = () => {
  const [alerts,    setAlerts]    = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await getAlertsApi()
      setAlerts(data)
    } catch {
      // Silently fail — alerts are non-critical
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  // Add a new alert to the top of the list (called from Socket.io event)
  const addAlert = useCallback((alertData) => {
    setAlerts(prev => [{
      id:        alertData.alertId,
      message:   alertData.message,
      productId: alertData.productId,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    }, ...prev])
  }, [])

  const resolveAlert = async (id) => {
    await resolveAlertApi(id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const resolveAll = async () => {
    await resolveAllAlertsApi()
    setAlerts([])
  }

  return {
    alerts,
    isLoading,
    unreadCount: alerts.length,
    addAlert,
    resolveAlert,
    resolveAll,
    refetch: fetchAlerts,
  }
}