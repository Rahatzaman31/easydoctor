import { lazy, Suspense, useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import ScrollToTop from './components/ScrollToTop'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import DoctorAdminLayout from './components/DoctorAdminLayout'
import { cacheManager } from './lib/cacheManager'

const API_URL = import.meta.env.VITE_API_URL || ''

const SpecialistDoctors = lazy(() => import('./pages/SpecialistDoctors'))
const DoctorProfile = lazy(() => import('./pages/DoctorProfile'))
const BookAppointment = lazy(() => import('./pages/BookAppointment'))
const PaidBookAppointment = lazy(() => import('./pages/PaidBookAppointment'))
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'))
const Download = lazy(() => import('./pages/Download'))
const HospitalsDiagnostics = lazy(() => import('./pages/HospitalsDiagnostics'))
const HospitalDetail = lazy(() => import('./pages/HospitalDetail'))
const BlogList = lazy(() => import('./pages/BlogList'))
const BlogDetail = lazy(() => import('./pages/BlogDetail'))
const DoctorChat = lazy(() => import('./pages/doctor-admin/DoctorChat'))
const AmbulanceService = lazy(() => import('./pages/AmbulanceService'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const Contact = lazy(() => import('./pages/Contact'))
const PromotionalDetail = lazy(() => import('./pages/PromotionalDetail'))
const JoinAsDoctor = lazy(() => import('./pages/JoinAsDoctor'))
const JoinAsHospital = lazy(() => import('./pages/JoinAsHospital'))
const RegisterAmbulance = lazy(() => import('./pages/RegisterAmbulance'))
const Advertise = lazy(() => import('./pages/Advertise'))
const DataEditRequest = lazy(() => import('./pages/DataEditRequest'))
const MediProducts = lazy(() => import('./pages/MediProducts'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const ProductOrderCallback = lazy(() => import('./pages/ProductOrderCallback'))
const DoctorLogin = lazy(() => import('./pages/doctor-admin/DoctorLogin'))
const DoctorDashboard = lazy(() => import('./pages/doctor-admin/DoctorDashboard'))
const DoctorProfilePage = lazy(() => import('./pages/doctor-admin/DoctorProfile'))
const DoctorAppointments = lazy(() => import('./pages/doctor-admin/DoctorAppointments'))
const DoctorPaidAppointments = lazy(() => import('./pages/doctor-admin/DoctorPaidAppointments'))
const DoctorBlogPosts = lazy(() => import('./pages/doctor-admin/DoctorBlogPosts'))
const DoctorPackages = lazy(() => import('./pages/doctor-admin/DoctorPackages'))
const DoctorAdvertisements = lazy(() => import('./pages/doctor-admin/DoctorAdvertisements'))
const InterstitialAd = lazy(() => import('./components/InterstitialAd'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)

function ClientLayout({ children, mediProductsVisible }) {
  return (
    <>
      <Navbar mediProductsVisible={mediProductsVisible} />
      <Suspense fallback={<PageLoader />}>
        <main id="main-content" role="main">
          {children}
        </main>
      </Suspense>
      <Suspense fallback={null}>
        <InterstitialAd />
      </Suspense>
    </>
  )
}

function App() {
  const [mediProductsVisible, setMediProductsVisible] = useState(false)

  useEffect(() => {
    // Fetch site settings once and cache them
    const fetchSettings = async () => {
      try {
        if (!API_URL) {
          setMediProductsVisible(false)
          return
        }
        const data = await cacheManager.getOrFetch(
          'site-settings',
          async () => {
            const response = await fetch(`${API_URL}/api/site-settings`)
            if (!response.ok) return {}
            const result = await response.json()
            return result.success && result.data ? result.data : {}
          },
          30 * 60 * 1000 // Cache for 30 minutes
        )
        setMediProductsVisible(data.medi_products_visible || false)
      } catch (error) {
        console.error('Error fetching site settings:', error)
        setMediProductsVisible(false)
      }
    }
    fetchSettings()
  }, [])

  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen">
          <Routes>
          <Route path="/doctor.admin/login" element={<Suspense fallback={<PageLoader />}><DoctorLogin /></Suspense>} />
          <Route path="/doctor.admin" element={<DoctorAdminLayout><DoctorDashboard /></DoctorAdminLayout>} />
          <Route path="/doctor.admin/profile" element={<DoctorAdminLayout><DoctorProfilePage /></DoctorAdminLayout>} />
          <Route path="/doctor.admin/appointments" element={<DoctorAdminLayout><DoctorAppointments /></DoctorAdminLayout>} />
          <Route path="/doctor.admin/paid-appointments" element={<DoctorAdminLayout><DoctorPaidAppointments /></DoctorAdminLayout>} />
          <Route path="/doctor.admin/blog-posts" element={<DoctorAdminLayout><DoctorBlogPosts /></DoctorAdminLayout>} />
          <Route path="/doctor.admin/packages" element={<DoctorAdminLayout><DoctorPackages /></DoctorAdminLayout>} />
          <Route path="/doctor.admin/advertisements" element={<DoctorAdminLayout><DoctorAdvertisements /></DoctorAdminLayout>} />
          <Route path="/doctor.admin/chat" element={<DoctorAdminLayout><DoctorChat /></DoctorAdminLayout>} />
          <Route path="/" element={<ClientLayout mediProductsVisible={mediProductsVisible}><Home /></ClientLayout>} />
          <Route path="/rangpur-specialist-doctors-list-online-serial" element={<ClientLayout mediProductsVisible={mediProductsVisible}><SpecialistDoctors /></ClientLayout>} />
          <Route path="/specialist-doctors" element={<ClientLayout mediProductsVisible={mediProductsVisible}><SpecialistDoctors /></ClientLayout>} />
          <Route path="/hospitals-diagnostics" element={<ClientLayout mediProductsVisible={mediProductsVisible}><HospitalsDiagnostics /></ClientLayout>} />
          <Route path="/hospital/:id" element={<ClientLayout mediProductsVisible={mediProductsVisible}><HospitalDetail /></ClientLayout>} />
          <Route path="/ambulance" element={<ClientLayout mediProductsVisible={mediProductsVisible}><AmbulanceService /></ClientLayout>} />
          <Route path="/blog" element={<ClientLayout mediProductsVisible={mediProductsVisible}><BlogList /></ClientLayout>} />
          <Route path="/blog/:slug" element={<ClientLayout mediProductsVisible={mediProductsVisible}><BlogDetail /></ClientLayout>} />
          <Route path="/download" element={<ClientLayout mediProductsVisible={mediProductsVisible}><Download /></ClientLayout>} />
          <Route path="/contact" element={<ClientLayout mediProductsVisible={mediProductsVisible}><Contact /></ClientLayout>} />
          <Route path="/join-as-doctor" element={<ClientLayout mediProductsVisible={mediProductsVisible}><JoinAsDoctor /></ClientLayout>} />
          <Route path="/join-as-hospital" element={<ClientLayout mediProductsVisible={mediProductsVisible}><JoinAsHospital /></ClientLayout>} />
          <Route path="/register-ambulance" element={<ClientLayout mediProductsVisible={mediProductsVisible}><RegisterAmbulance /></ClientLayout>} />
          <Route path="/advertise" element={<ClientLayout mediProductsVisible={mediProductsVisible}><Advertise /></ClientLayout>} />
          <Route path="/data-edit-request" element={<ClientLayout mediProductsVisible={mediProductsVisible}><DataEditRequest /></ClientLayout>} />
          <Route path="/about-us" element={<ClientLayout mediProductsVisible={mediProductsVisible}><AboutUs /></ClientLayout>} />
          <Route path="/promotional/:id" element={<ClientLayout mediProductsVisible={mediProductsVisible}><PromotionalDetail /></ClientLayout>} />
          <Route path="/editorial-policy" element={<ClientLayout mediProductsVisible={mediProductsVisible}><LegalPage /></ClientLayout>} />
          <Route path="/advertisement-policy" element={<ClientLayout mediProductsVisible={mediProductsVisible}><LegalPage /></ClientLayout>} />
          <Route path="/correction-policy" element={<ClientLayout mediProductsVisible={mediProductsVisible}><LegalPage /></ClientLayout>} />
          <Route path="/terms-of-use" element={<ClientLayout mediProductsVisible={mediProductsVisible}><LegalPage /></ClientLayout>} />
          <Route path="/doctors-terms" element={<ClientLayout mediProductsVisible={mediProductsVisible}><LegalPage /></ClientLayout>} />
          <Route path="/privacy-policy" element={<ClientLayout mediProductsVisible={mediProductsVisible}><LegalPage /></ClientLayout>} />
          <Route path="/terms-conditions" element={<ClientLayout mediProductsVisible={mediProductsVisible}><LegalPage /></ClientLayout>} />
          <Route path="/doctor/:id" element={<ClientLayout mediProductsVisible={mediProductsVisible}><DoctorProfile /></ClientLayout>} />
          <Route path="/book/:doctorId" element={<ClientLayout mediProductsVisible={mediProductsVisible}><BookAppointment /></ClientLayout>} />
          <Route path="/paid-book/callback" element={<ClientLayout mediProductsVisible={mediProductsVisible}><PaymentCallback /></ClientLayout>} />
          <Route path="/paid-book/:doctorId" element={<ClientLayout mediProductsVisible={mediProductsVisible}><PaidBookAppointment /></ClientLayout>} />
          <Route path="/medi-products" element={<ClientLayout mediProductsVisible={mediProductsVisible}><MediProducts /></ClientLayout>} />
          <Route path="/product/:id" element={<ClientLayout mediProductsVisible={mediProductsVisible}><ProductDetail /></ClientLayout>} />
          <Route path="/product-order/callback" element={<ClientLayout mediProductsVisible={mediProductsVisible}><ProductOrderCallback /></ClientLayout>} />
          </Routes>
        </div>
      </Router>
    </HelmetProvider>
  )
}

export default App
