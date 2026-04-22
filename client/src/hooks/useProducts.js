// src/hooks/useProducts.js
//
// Manages the full product list with pagination, search, and filtering.
// Uses a params object so callers can easily change any filter and refetch.

import { useState, useCallback } from 'react'
import { getProductsApi, createProductApi, updateProductApi, deleteProductApi } from '../api/products'

export const useProducts = () => {
  const [products,   setProducts]   = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState(null)
  const [params,     setParams]     = useState({ page: 1, limit: 20, search: '', categoryId: '' })

  // Core fetch — merges new values into current params then calls the API
  const fetchProducts = useCallback(async (overrides = {}) => {
    setIsLoading(true)
    setError(null)
    try {
      const merged = { ...params, ...overrides }

      // Build clean query — only include non-empty values
      const query = {}
      if (merged.page)       query.page       = merged.page
      if (merged.limit)      query.limit      = merged.limit
      if (merged.search)     query.search     = merged.search
      if (merged.categoryId) query.categoryId = merged.categoryId

      const data = await getProductsApi(query)
      setProducts(data.products)
      setPagination(data.pagination)
      setParams(merged)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products.')
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  // Fetch on mount — call directly with default params to avoid stale closure
  useState(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        const data = await getProductsApi({ page: 1, limit: 20 })
        setProducts(data.products)
        setPagination(data.pagination)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load products.')
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const createProduct = async (data) => {
    const created = await createProductApi(data)
    setProducts(prev => [created, ...prev])
    setPagination(prev => ({ ...prev, total: prev.total + 1 }))
    return created
  }

  const updateProduct = async (id, data) => {
    const updated = await updateProductApi(id, data)
    setProducts(prev => prev.map(p => p.id === id ? {
      ...updated,
      totalStock: updated.stockLevels?.reduce((sum, sl) => sum + sl.quantity, 0) ?? p.totalStock,
    } : p))
    return updated
  }

  const deleteProduct = async (id) => {
    await deleteProductApi(id)
    setProducts(prev => prev.filter(p => p.id !== id))
    setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }))
  }

  // These trigger a fresh fetch with updated params
  const goToPage = (page)       => fetchProducts({ page })
  const search   = (search)     => fetchProducts({ search, page: 1 })
  const filterBy = (categoryId) => fetchProducts({ categoryId, page: 1 })
  const refetch  = ()           => fetchProducts({})

  return {
    products, pagination, isLoading, error, params,
    createProduct, updateProduct, deleteProduct,
    goToPage, search, filterBy, refetch,
  }
}