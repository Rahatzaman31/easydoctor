import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DoctorAdminSidebar from './DoctorAdminSidebar'

function DoctorAdminLayout({ children }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!localStorage.getItem('doctorLoggedIn')) {
      navigate('/doctor.admin/login')
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DoctorAdminSidebar />
      <div className="flex-1 p-4 pt-16 lg:pt-6 lg:p-8">
        {children}
      </div>
    </div>
  )
}

export default DoctorAdminLayout
