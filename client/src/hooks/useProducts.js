// src/hooks/useProducts.js
//
// Manages the full product list with pagination, search, and filtering.
// Uses a params object so callers can easily change any filter and refetch.

import { useState, useEffect, useCallback } from 'react'
import { getProductsApi, createProductApi, updateProductApi, deleteProductApi } from '../api/products'

export const useProducts = () => {
  const [products,   setProducts]   = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState(null)

  // Filter/search params — change any of these and call fetchProducts()
  const [params, setParams] = useState({ page: 1, limit: 20, search: '', categoryId: '' })

  const fetchProducts = useCallback(async (overrides = {}) => {
    setIsLoading(true)
    setError(null)
    try {
      // Merge current params with any overrides, strip empty strings
      const merged = { ...params, ...overrides }
      const cleaned = Object.fromEntries(
        Object.entries(merged).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      )
      const data = await getProductsApi(cleaned)
      setProducts(data.products)
      setPagination(data.pagination)
      // Save merged params as the new current params
      setParams(merged)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products.')
    } finally {
      setIsLoading(false)
    }
  }, [params])

  // Fetch on mount
  useEffect(() => { fetchProducts() }, []) // eslint-disable-line

  const createProduct = async (data) => {
    const created = await createProductApi(data)
    // Prepend to list so new product appears at the top
    setProducts(prev => [created, ...prev])
    return created
  }

  const updateProduct = async (id, data) => {
    const updated = await updateProductApi(id, data)
    setProducts(prev => prev.map(p => p.id === id ? updated : p))
    return updated
  }

  const deleteProduct = async (id) => {
    await deleteProductApi(id)
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const goToPage = (page) => fetchProducts({ page })
  const search   = (term) => fetchProducts({ search: term, page: 1 })
  const filterBy = (categoryId) => fetchProducts({ categoryId, page: 1 })

  return {
    products, pagination, isLoading, error, params,
    createProduct, updateProduct, deleteProduct,
    goToPage, search, filterBy,
    refetch: () => fetchProducts(),
  }
}