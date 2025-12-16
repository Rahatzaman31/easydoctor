import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import ScrollToTop from './components/ScrollToTop'
import Navbar from './components/Navbar'
import Home from './pages/Home'

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
const DoctorChat = lazy(() => import('./pages/doctor-admin/DoctorChat'))
const InterstitialAd = lazy(() => import('./components/InterstitialAd'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)

function ClientLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Suspense fallback={null}>
        <InterstitialAd />
      </Suspense>
    </>
  )
}

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen">
          <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/doctor.admin/login" element={<DoctorLogin />} />
          <Route path="/doctor.admin" element={<DoctorDashboard />} />
          <Route path="/doctor.admin/profile" element={<DoctorProfilePage />} />
          <Route path="/doctor.admin/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor.admin/paid-appointments" element={<DoctorPaidAppointments />} />
          <Route path="/doctor.admin/blog-posts" element={<DoctorBlogPosts />} />
          <Route path="/doctor.admin/packages" element={<DoctorPackages />} />
          <Route path="/doctor.admin/advertisements" element={<DoctorAdvertisements />} />
          <Route path="/doctor.admin/chat" element={<DoctorChat />} />
          <Route path="/" element={<ClientLayout><Home /></ClientLayout>} />
          <Route path="/rangpur-specialist-doctors-list-online-serial" element={<ClientLayout><SpecialistDoctors /></ClientLayout>} />
          <Route path="/specialist-doctors" element={<ClientLayout><SpecialistDoctors /></ClientLayout>} />
          <Route path="/hospitals-diagnostics" element={<ClientLayout><HospitalsDiagnostics /></ClientLayout>} />
          <Route path="/hospital/:id" element={<ClientLayout><HospitalDetail /></ClientLayout>} />
          <Route path="/ambulance" element={<ClientLayout><AmbulanceService /></ClientLayout>} />
          <Route path="/blog" element={<ClientLayout><BlogList /></ClientLayout>} />
          <Route path="/blog/:slug" element={<ClientLayout><BlogDetail /></ClientLayout>} />
          <Route path="/download" element={<ClientLayout><Download /></ClientLayout>} />
          <Route path="/contact" element={<ClientLayout><Contact /></ClientLayout>} />
          <Route path="/join-as-doctor" element={<ClientLayout><JoinAsDoctor /></ClientLayout>} />
          <Route path="/join-as-hospital" element={<ClientLayout><JoinAsHospital /></ClientLayout>} />
          <Route path="/register-ambulance" element={<ClientLayout><RegisterAmbulance /></ClientLayout>} />
          <Route path="/advertise" element={<ClientLayout><Advertise /></ClientLayout>} />
          <Route path="/data-edit-request" element={<ClientLayout><DataEditRequest /></ClientLayout>} />
          <Route path="/about-us" element={<ClientLayout><AboutUs /></ClientLayout>} />
          <Route path="/promotional/:id" element={<ClientLayout><PromotionalDetail /></ClientLayout>} />
          <Route path="/editorial-policy" element={<ClientLayout><LegalPage /></ClientLayout>} />
          <Route path="/advertisement-policy" element={<ClientLayout><LegalPage /></ClientLayout>} />
          <Route path="/correction-policy" element={<ClientLayout><LegalPage /></ClientLayout>} />
          <Route path="/terms-of-use" element={<ClientLayout><LegalPage /></ClientLayout>} />
          <Route path="/doctors-terms" element={<ClientLayout><LegalPage /></ClientLayout>} />
          <Route path="/privacy-policy" element={<ClientLayout><LegalPage /></ClientLayout>} />
          <Route path="/terms-conditions" element={<ClientLayout><LegalPage /></ClientLayout>} />
          <Route path="/doctor/:id" element={<ClientLayout><DoctorProfile /></ClientLayout>} />
          <Route path="/book/:doctorId" element={<ClientLayout><BookAppointment /></ClientLayout>} />
          <Route path="/paid-book/callback" element={<ClientLayout><PaymentCallback /></ClientLayout>} />
          <Route path="/paid-book/:doctorId" element={<ClientLayout><PaidBookAppointment /></ClientLayout>} />
          <Route path="/medi-products" element={<ClientLayout><MediProducts /></ClientLayout>} />
          <Route path="/product/:id" element={<ClientLayout><ProductDetail /></ClientLayout>} />
          <Route path="/product-order/callback" element={<ClientLayout><ProductOrderCallback /></ClientLayout>} />
          </Routes>
          </Suspense>
        </div>
      </Router>
    </HelmetProvider>
  )
}

export default App
