import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import ScrollToTop from './components/ScrollToTop'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import SpecialistDoctors from './pages/SpecialistDoctors'
import DoctorProfile from './pages/DoctorProfile'
import BookAppointment from './pages/BookAppointment'
import PaidBookAppointment from './pages/PaidBookAppointment'
import PaymentCallback from './pages/PaymentCallback'
import Download from './pages/Download'
import HospitalsDiagnostics from './pages/HospitalsDiagnostics'
import HospitalDetail from './pages/HospitalDetail'
import BlogList from './pages/BlogList'
import BlogDetail from './pages/BlogDetail'
import AmbulanceService from './pages/AmbulanceService'
import LegalPage from './pages/LegalPage'
import AboutUs from './pages/AboutUs'
import Contact from './pages/Contact'
import PromotionalDetail from './pages/PromotionalDetail'
import JoinAsDoctor from './pages/JoinAsDoctor'
import JoinAsHospital from './pages/JoinAsHospital'
import RegisterAmbulance from './pages/RegisterAmbulance'
import Advertise from './pages/Advertise'
import DataEditRequest from './pages/DataEditRequest'
import MediProducts from './pages/MediProducts'
import ProductDetail from './pages/ProductDetail'
import ProductOrderCallback from './pages/ProductOrderCallback'
import DoctorLogin from './pages/doctor-admin/DoctorLogin'
import DoctorDashboard from './pages/doctor-admin/DoctorDashboard'
import DoctorProfilePage from './pages/doctor-admin/DoctorProfile'
import DoctorAppointments from './pages/doctor-admin/DoctorAppointments'
import DoctorPaidAppointments from './pages/doctor-admin/DoctorPaidAppointments'
import DoctorBlogPosts from './pages/doctor-admin/DoctorBlogPosts'
import DoctorPackages from './pages/doctor-admin/DoctorPackages'
import DoctorAdvertisements from './pages/doctor-admin/DoctorAdvertisements'
import InterstitialAd from './components/InterstitialAd'

function ClientLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <InterstitialAd />
    </>
  )
}

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen">
          <Routes>
          <Route path="/doctor.admin/login" element={<DoctorLogin />} />
          <Route path="/doctor.admin" element={<DoctorDashboard />} />
          <Route path="/doctor.admin/profile" element={<DoctorProfilePage />} />
          <Route path="/doctor.admin/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor.admin/paid-appointments" element={<DoctorPaidAppointments />} />
          <Route path="/doctor.admin/blog-posts" element={<DoctorBlogPosts />} />
          <Route path="/doctor.admin/packages" element={<DoctorPackages />} />
          <Route path="/doctor.admin/advertisements" element={<DoctorAdvertisements />} />
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
        </div>
      </Router>
    </HelmetProvider>
  )
}

export default App
