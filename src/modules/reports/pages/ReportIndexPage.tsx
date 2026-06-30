import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_DOMAIN } from '../constants/reportCategories'

export default function ReportIndexPage() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate(`/reports/${DEFAULT_DOMAIN}`, { replace: true })
  }, [navigate])
  return null
}
