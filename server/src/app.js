import express      from 'express'
import cors         from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes      from './modules/auth/auth.routes.js'
import categoryRoutes  from './modules/categories/category.routes.js'
import warehouseRoutes from './modules/warehouses/warehouse.routes.js'
import productRoutes   from './modules/products/product.routes.js'

const app = express()

app.use(cors({
  origin:         process.env.CLIENT_URL || 'http://localhost:5173',
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/api/auth',       authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/warehouses', warehouseRoutes)
app.use('/api/products',   productRoutes)

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
)

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` })
})

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

export default app