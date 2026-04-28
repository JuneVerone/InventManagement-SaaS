import { getAlertsService, resolveAlertService, resolveAllAlertsService } from './alert.service.js'

export const getAlerts = async (req, res) => {
  try {
    const alerts = await getAlertsService(req.org.id)
    res.json({ success: true, data: alerts })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const resolveAlert = async (req, res) => {
  try {
    const alert = await resolveAlertService(req.org.id, req.params.id)
    res.json({ success: true, data: alert })
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message })
  }
}

export const resolveAllAlerts = async (req, res) => {
  try {
    await resolveAllAlertsService(req.org.id)
    res.json({ success: true, message: 'All alerts resolved.' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}