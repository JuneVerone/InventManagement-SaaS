// src/hooks/useSocket.js
//
// Manages the Socket.io connection lifecycle.
// Connects when the user is authenticated, disconnects on logout.
// Joins the org room so the user receives their org's real-time events.

import { useEffect, useRef } from 'react'
import { io }                from 'socket.io-client'
import { useAuthStore }      from '../store/authStore'

export const useSocket = (onStockLow) => {
  const socketRef = useRef(null)
  const org       = useAuthStore(s => s.org)
  const accessToken = useAuthStore(s => s.accessToken)

  useEffect(() => {
    // Only connect if the user is authenticated
    if (!accessToken || !org?.id) return

    // Connect to Socket.io server
    const socket = io('http://localhost:3000', {
      withCredentials: true,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('🔌 Socket.io connected')
      // Join the org room to receive org-scoped events
      socket.emit('join:org', org.id)
    })

    // Listen for low-stock alerts pushed from the server
    socket.on('stock:low', (data) => {
      console.log('🔔 Low stock alert received:', data)
      if (onStockLow) onStockLow(data)
    })

    socket.on('disconnect', () => {
      console.log('🔌 Socket.io disconnected')
    })

    // Cleanup — disconnect when component unmounts or user logs out
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [accessToken, org?.id]) // Reconnect if auth changes

  return socketRef
}