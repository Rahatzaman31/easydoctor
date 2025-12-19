import { Suspense } from 'react'
import DoctorAdminSidebar from './DoctorAdminSidebar'

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)

function DoctorAdminLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <DoctorAdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default DoctorAdminLayout
