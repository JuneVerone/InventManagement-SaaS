// src/hooks/useCategories.js
// Fetches and manages category list for the current org.

import { useState, useEffect, useCallback } from 'react'
import { getCategoriesApi, createCategoryApi, deleteCategoryApi } from '../api/categories'

export const useCategories = () => {
  const [categories, setCategories]   = useState([])
  const [isLoading,  setIsLoading]    = useState(true)
  const [error,      setError]        = useState(null)

  const fetchCategories = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getCategoriesApi()
      setCategories(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const createCategory = async (name) => {
    const created = await createCategoryApi({ name })
    setCategories(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    return created
  }

  const deleteCategory = async (id) => {
    await deleteCategoryApi(id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return { categories, isLoading, error, createCategory, deleteCategory, refetch: fetchCategories }
}