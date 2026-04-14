// src/hooks/useWarehouses.js
import { useState, useEffect, useCallback } from 'react'
import { getWarehousesApi, createWarehouseApi, deleteWarehouseApi } from '../api/warehouses'

export const useWarehouses = () => {
  const [warehouses, setWarehouses] = useState([])
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState(null)

  const fetchWarehouses = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getWarehousesApi()
      setWarehouses(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load warehouses.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchWarehouses() }, [fetchWarehouses])

  const createWarehouse = async (data) => {
    const created = await createWarehouseApi(data)
    setWarehouses(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    return created
  }

  const deleteWarehouse = async (id) => {
    await deleteWarehouseApi(id)
    setWarehouses(prev => prev.filter(w => w.id !== id))
  }

  return { warehouses, isLoading, error, createWarehouse, deleteWarehouse, refetch: fetchWarehouses }
}