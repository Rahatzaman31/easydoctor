import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminDoctors from './pages/admin/AdminDoctors'
import AdminCategories from './pages/admin/AdminCategories'
import AdminAppointments from './pages/admin/AdminAppointments'
import AdminReviews from './pages/admin/AdminReviews'
import AdminBkashSettings from './pages/admin/AdminBkashSettings'
import AdminPaidAppointments from './pages/admin/AdminPaidAppointments'
import AdminHospitals from './pages/admin/AdminHospitals'
import AdminBlogs from './pages/admin/AdminBlogs'
import AdminAmbulance from './pages/admin/AdminAmbulance'
import AdminBanners from './pages/admin/AdminBanners'
import AdminContactSettings from './pages/admin/AdminContactSettings'
import AdminPromotionalBanners from './pages/admin/AdminPromotionalBanners'
import AdminHealthcareProviders from './pages/admin/AdminHealthcareProviders'
import AdminLegalPages from './pages/admin/AdminLegalPages'
import AdminAboutUs from './pages/admin/AdminAboutUs'
import AdminDoctorPortal from './pages/admin/AdminDoctorPortal'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductOrders from './pages/admin/AdminProductOrders'
import AdminProductReviews from './pages/admin/AdminProductReviews'
import AdminInterstitialAds from './pages/admin/AdminInterstitialAds'
import AdminSEO from './pages/admin/AdminSEO'
import AdminDoctorPackages from './pages/admin/AdminDoctorPackages'
import AdminAdvertisementSettings from './pages/admin/AdminAdvertisementSettings'
import AdminProfileAdBanners from './pages/admin/AdminProfileAdBanners'
import AdminSerialTypeSettings from './pages/admin/AdminSerialTypeSettings'
import AdminChat from './pages/admin/AdminChat'
import AdminImageUpload from './pages/admin/AdminImageUpload'

function App() {
  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/chat" element={<AdminChat />} />
          <Route path="/admin/doctors" element={<AdminDoctors />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/appointments" element={<AdminAppointments />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/bkash-settings" element={<AdminBkashSettings />} />
          <Route path="/admin/paid-appointments" element={<AdminPaidAppointments />} />
          <Route path="/admin/hospitals" element={<AdminHospitals />} />
          <Route path="/admin/blogs" element={<AdminBlogs />} />
          <Route path="/admin/ambulance" element={<AdminAmbulance />} />
          <Route path="/admin/banners" element={<AdminBanners />} />
          <Route path="/admin/promotional-banners" element={<AdminPromotionalBanners />} />
          <Route path="/admin/contact-settings" element={<AdminContactSettings />} />
          <Route path="/admin/healthcare-providers" element={<AdminHealthcareProviders />} />
          <Route path="/admin/legal-pages" element={<AdminLegalPages />} />
          <Route path="/admin/about-us" element={<AdminAboutUs />} />
          <Route path="/admin/doctor-portal" element={<AdminDoctorPortal />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/product-orders" element={<AdminProductOrders />} />
          <Route path="/admin/product-reviews" element={<AdminProductReviews />} />
          <Route path="/admin/interstitial-ads" element={<AdminInterstitialAds />} />
          <Route path="/admin/seo" element={<AdminSEO />} />
          <Route path="/admin/doctor-packages" element={<AdminDoctorPackages />} />
          <Route path="/admin/advertisement-settings" element={<AdminAdvertisementSettings />} />
          <Route path="/admin/profile-ad-banners" element={<AdminProfileAdBanners />} />
          <Route path="/admin/serial-type-settings" element={<AdminSerialTypeSettings />} />
          <Route path="/admin/image-upload" element={<AdminImageUpload />} />
          </Routes>
        </div>
      </Router>
    </HelmetProvider>
  )
}

export default App
