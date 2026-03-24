import 'dotenv/config'
import app from './app.js'
import prisma from './config/db.js'

const PORT = process.env.PORT || 3000

async function startServer() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected')
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

startServer()