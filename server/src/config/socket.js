// src/config/socket.js
//
// Socket.io enables real-time bidirectional communication between server and browser.
// Unlike HTTP (request → response), Socket.io keeps a persistent connection open
// so the server can PUSH data to the client at any time.
//
// ── HOW ORG ROOMS WORK ───────────────────────────────────────────────────────
// Socket.io has a concept of "rooms" — named channels.
// When a user connects, they join a room named after their orgId.
// When the server emits to that room, ONLY users in that org receive the event.
// This is how multi-tenancy works in real-time — org A never sees org B's alerts.
//
// Flow:
//   1. User logs in → browser connects to Socket.io
//   2. Client emits 'join:org' with their orgId
//   3. Server puts that socket in room `org:${orgId}`
//   4. When a low-stock alert fires → server emits to `org:${orgId}`
//   5. Only that org's users receive the toast notification

import { Server } from 'socket.io'

let io = null

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)

    // Client joins their org room after connecting
    socket.on('join:org', (orgId) => {
      if (!orgId) return
      socket.join(`org:${orgId}`)
      console.log(`Socket ${socket.id} joined org room: org:${orgId}`)
    })

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`)
    })
  })

  return io
}

// Emit an event to all users in a specific org's room
// Usage: emitToOrg('abc123', 'stock:low', { productName: 'Widget', stock: 3 })
export const emitToOrg = (orgId, event, data) => {
  if (!io) return
  io.to(`org:${orgId}`).emit(event, data)
}

export const getIO = () => io