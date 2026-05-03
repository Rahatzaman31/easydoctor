import AdminSidebar from './AdminSidebar'

function AdminLayout({ children, title }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-4 pt-16 lg:pt-4 lg:p-8">
        {title && (
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-6 lg:mb-8">{title}</h1>
        )}
        {children}
      </div>
    </div>
  )
}

export default AdminLayout
