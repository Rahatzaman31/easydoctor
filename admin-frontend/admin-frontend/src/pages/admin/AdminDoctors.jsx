import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

const ReactQuill = lazy(() => import('react-quill'))
import 'react-quill/dist/quill.snow.css'

const categories = [
  { id: 'medicine', name: 'সাধারণ রোগ বিশেষজ্ঞ' },
  { id: 'cardiology', name: 'হৃদরোগ বিশেষজ্ঞ' },
  { id: 'neurology', name: 'মস্তিষ্ক ও স্নায়ু রোগ বিশেষজ্ঞ' },
  { id: 'gynecology', name: 'প্রসূতি ও স্ত্রীরোগ বিশেষজ্ঞ' },
  { id: 'pediatrics', name: 'শিশু রোগ বিশেষজ্ঞ' },
  { id: 'orthopedics', name: 'হাড় ও জয়েন্ট রোগ বিশেষজ্ঞ' },
  { id: 'ent', name: 'নাক-কান-গলা বিশেষজ্ঞ' },
  { id: 'dermatology', name: 'চর্মরোগ বিশেষজ্ঞ' },
  { id: 'psychiatry', name: 'মানসিক রোগ বিশেষজ্ঞ' },
  { id: 'ophthalmology', name: 'চক্ষু রোগ বিশেষজ্ঞ' },
  { id: 'dental', name: 'দন্ত বিশেষজ্ঞ' },
  { id: 'surgery', name: 'সার্জারি বিশেষজ্ঞ' },
  { id: 'oncology', name: 'ক্যান্সার রোগ বিশেষজ্ঞ' },
  { id: 'pulmonology', name: 'শ্বাসতন্ত্র রোগ বিশেষজ্ঞ' },
  { id: 'endocrinology', name: 'হরমোন রোগ বিশেষজ্ঞ' },
  { id: 'anesthesia', name: 'চেতনানাশক বিশেষজ্ঞ' },
  { id: 'nephrology', name: 'কিডনি রোগ বিশেষজ্ঞ' },
  { id: 'urology', name: 'মূত্রতন্ত্র রোগ বিশেষজ্ঞ' },
  { id: 'gastroenterology', name: 'পরিপাকতন্ত্র বিশেষজ্ঞ' },
  { id: 'rheumatology', name: 'বাত রোগ বিশেষজ্ঞ' },
  { id: 'pathology', name: 'রোগ নির্ণয় বিশেষজ্ঞ' },
  { id: 'plastic-surgery', name: 'প্লাস্টিক সার্জন' },
  { id: 'physiotherapy', name: 'ফিজিওথেরাপিস্ট' },
  { id: 'nutrition', name: 'পুষ্টিবিদ' },
]

const districts = ['রংপুর', 'দিনাজপুর', 'কুড়িগ্রাম', 'লালমনিরহাট', 'নীলফামারী', 'গাইবান্ধা', 'ঠাকুরগাঁও', 'পঞ্চগড়']

const weekDays = [
  { id: 'saturday', name: 'শনিবার' },
  { id: 'sunday', name: 'রবিবার' },
  { id: 'monday', name: 'সোমবার' },
  { id: 'tuesday', name: 'মঙ্গলবার' },
  { id: 'wednesday', name: 'বুধবার' },
  { id: 'thursday', name: 'বৃহস্পতিবার' },
  { id: 'friday', name: 'শুক্রবার' },
]

function AdminDoctors() {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    degrees: '',
    workplace_line1: '',
    workplace_line2: '',
    category: 'medicine',
    category_name: 'সাধারণ রোগ বিশেষজ্ঞ',
    district: 'রংপুর',
    chamber_address: '',
    phone: '',
    consultation_fee: '',
    daily_appointment_limit: '',
    paid_appointment_limit: '',
    online_appointment: true,
    schedule_days: [],
    schedule_time: '',
    about: '',
    image_url: '',
    rating: '',
    reviews_count: '',
    notice: '',
    visiting_card_url: '',
    is_active: true
  })

  const [showExpertiseModal, setShowExpertiseModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [expertiseList, setExpertiseList] = useState([])
  const [reviewsList, setReviewsList] = useState([])
  const [expertiseForm, setExpertiseForm] = useState({ title: '', description: '' })
  const [reviewForm, setReviewForm] = useState({ patient_name: '', rating: 5, review_text: '' })
  const [editingExpertise, setEditingExpertise] = useState(null)
  const [editingReview, setEditingReview] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchDoctors()
  }, [])

  async function fetchDoctors() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setDoctors(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchExpertise(doctorId) {
    try {
      if (!supabase || !isConfigured) return
      const { data, error } = await supabase
        .from('doctor_expertise')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('id', { ascending: true })
      
      if (error) throw error
      setExpertiseList(data || [])
    } catch (error) {
      console.error('Error fetching expertise:', error)
    }
  }

  async function fetchReviews(doctorId) {
    try {
      if (!supabase || !isConfigured) return
      const { data, error } = await supabase
        .from('doctor_reviews')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setReviewsList(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    
    if (name === 'category') {
      const cat = categories.find(c => c.id === value)
      setFormData({
        ...formData,
        category: value,
        category_name: cat?.name || value
      })
    } else if (name === 'schedule_day') {
      const dayId = value
      let newDays = [...formData.schedule_days]
      if (checked) {
        if (!newDays.includes(dayId)) {
          newDays.push(dayId)
        }
      } else {
        newDays = newDays.filter(d => d !== dayId)
      }
      setFormData({
        ...formData,
        schedule_days: newDays
      })
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      })
    }
  }

  function openAddModal() {
    setEditingDoctor(null)
    setFormData({
      name: '',
      degrees: '',
      workplace_line1: '',
      workplace_line2: '',
      category: 'medicine',
      category_name: 'সাধারণ রোগ বিশেষজ্ঞ',
      district: 'রংপুর',
      chamber_address: '',
      phone: '',
      consultation_fee: '',
      daily_appointment_limit: '',
      paid_appointment_limit: '',
      online_appointment: true,
      schedule_days: [],
      schedule_time: '',
      about: '',
      image_url: '',
      rating: '',
      reviews_count: '',
      notice: '',
      visiting_card_url: '',
      is_active: true
    })
    setShowModal(true)
  }

  function openEditModal(doctor) {
    setEditingDoctor(doctor)
    let scheduleDays = []
    try {
      scheduleDays = doctor.schedule_days ? JSON.parse(doctor.schedule_days) : []
    } catch (e) {
      scheduleDays = []
    }
    setFormData({
      name: doctor.name,
      degrees: doctor.degrees,
      workplace_line1: doctor.workplace_line1 || '',
      workplace_line2: doctor.workplace_line2 || '',
      category: doctor.category,
      category_name: doctor.category_name,
      district: doctor.district,
      chamber_address: doctor.chamber_address,
      phone: doctor.phone || '',
      consultation_fee: doctor.consultation_fee,
      daily_appointment_limit: doctor.daily_appointment_limit || '',
      paid_appointment_limit: doctor.paid_appointment_limit || '',
      online_appointment: doctor.online_appointment !== false,
      schedule_days: scheduleDays,
      schedule_time: doctor.schedule_time || '',
      about: doctor.about || '',
      image_url: doctor.image_url || '',
      rating: doctor.rating || '',
      reviews_count: doctor.reviews_count || '',
      notice: doctor.notice || '',
      visiting_card_url: doctor.visiting_card_url || '',
      is_active: doctor.is_active
    })
    setShowModal(true)
  }

  function openExpertiseModal(doctor) {
    setSelectedDoctor(doctor)
    setExpertiseForm({ title: '', description: '' })
    setEditingExpertise(null)
    fetchExpertise(doctor.id)
    setShowExpertiseModal(true)
  }

  function openReviewModal(doctor) {
    setSelectedDoctor(doctor)
    setReviewForm({ patient_name: '', rating: 5, review_text: '' })
    setEditingReview(null)
    fetchReviews(doctor.id)
    setShowReviewModal(true)
  }

  function generateAccessCode() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  async function generateUniqueAccessCode(maxRetries = 5) {
    for (let i = 0; i < maxRetries; i++) {
      const code = generateAccessCode()
      const { data, error } = await supabase
        .from('doctors')
        .select('id')
        .eq('access_code', code)
        .maybeSingle()
      
      if (!error && !data) {
        return code
      }
    }
    return generateAccessCode()
  }

  async function regenerateAccessCode(doctorId) {
    if (!confirm('নতুন অ্যাক্সেস কোড জেনারেট করতে চান?')) return
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }
      const newCode = await generateUniqueAccessCode()
      const { error } = await supabase
        .from('doctors')
        .update({ access_code: newCode })
        .eq('id', doctorId)
      
      if (error) throw error
      alert(`নতুন অ্যাক্সেস কোড: ${newCode}`)
      fetchDoctors()
    } catch (error) {
      console.error('Error regenerating access code:', error)
      alert('অ্যাক্সেস কোড রিজেনারেট করতে সমস্যা হয়েছে')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }
      
      const dataToSave = {
        ...formData,
        schedule_days: JSON.stringify(formData.schedule_days),
        rating: formData.rating === '' ? null : parseFloat(formData.rating),
        reviews_count: formData.reviews_count === '' ? null : parseInt(formData.reviews_count),
        daily_appointment_limit: formData.daily_appointment_limit === '' ? null : parseInt(formData.daily_appointment_limit),
        paid_appointment_limit: formData.paid_appointment_limit === '' ? null : parseInt(formData.paid_appointment_limit),
        consultation_fee: formData.consultation_fee === '' ? null : parseInt(formData.consultation_fee)
      }
      
      if (editingDoctor) {
        const { error } = await supabase
          .from('doctors')
          .update(dataToSave)
          .eq('id', editingDoctor.id)
        
        if (error) throw error
      } else {
        dataToSave.access_code = await generateUniqueAccessCode()
        dataToSave.package_type = 'standard'
        const { error } = await supabase
          .from('doctors')
          .insert([dataToSave])
        
        if (error) throw error
      }
      
      setShowModal(false)
      fetchDoctors()
    } catch (error) {
      console.error('Error:', error)
      alert('সংরক্ষণ করতে সমস্যা হয়েছে')
    }
  }

  async function handleExpertiseSubmit(e) {
    e.preventDefault()
    
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }

      if (editingExpertise) {
        const { error } = await supabase
          .from('doctor_expertise')
          .update({ title: expertiseForm.title, description: expertiseForm.description })
          .eq('id', editingExpertise.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('doctor_expertise')
          .insert([{ doctor_id: selectedDoctor.id, ...expertiseForm }])
        
        if (error) throw error
      }
      
      setExpertiseForm({ title: '', description: '' })
      setEditingExpertise(null)
      fetchExpertise(selectedDoctor.id)
    } catch (error) {
      console.error('Error:', error)
      alert('সংরক্ষণ করতে সমস্যা হয়েছে')
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault()
    
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }

      const rating = parseInt(reviewForm.rating)
      if (isNaN(rating) || rating < 1 || rating > 5) {
        alert('রেটিং ১ থেকে ৫ এর মধ্যে হতে হবে')
        return
      }

      const reviewData = {
        ...reviewForm,
        rating: rating,
        status: 'approved'
      }

      if (editingReview) {
        const { error } = await supabase
          .from('doctor_reviews')
          .update(reviewData)
          .eq('id', editingReview.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('doctor_reviews')
          .insert([{ doctor_id: selectedDoctor.id, ...reviewData }])
        
        if (error) throw error
      }
      
      setReviewForm({ patient_name: '', rating: 5, review_text: '' })
      setEditingReview(null)
      fetchReviews(selectedDoctor.id)
    } catch (error) {
      console.error('Error:', error)
      alert('সংরক্ষণ করতে সমস্যা হয়েছে')
    }
  }

  async function handleDeleteExpertise(id) {
    if (!confirm('আপনি কি নিশ্চিত মুছে ফেলতে চান?')) return
    
    try {
      if (!supabase || !isConfigured) return
      const { error } = await supabase.from('doctor_expertise').delete().eq('id', id)
      if (error) throw error
      fetchExpertise(selectedDoctor.id)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function handleDeleteReview(id) {
    if (!confirm('আপনি কি নিশ্চিত মুছে ফেলতে চান?')) return
    
    try {
      if (!supabase || !isConfigured) return
      const { error } = await supabase.from('doctor_reviews').delete().eq('id', id)
      if (error) throw error
      fetchReviews(selectedDoctor.id)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  function editExpertise(item) {
    setEditingExpertise(item)
    setExpertiseForm({ title: item.title, description: item.description })
  }

  function editReview(item) {
    setEditingReview(item)
    setReviewForm({ patient_name: item.patient_name, rating: item.rating, review_text: item.review_text })
  }

  async function handleDelete(id) {
    if (!confirm('আপনি কি নিশ্চিত এই ডাক্তার মুছে ফেলতে চান?')) return
    
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }
      const { error } = await supabase.from('doctors').delete().eq('id', id)
      if (error) throw error
      fetchDoctors()
    } catch (error) {
      console.error('Error:', error)
      alert('মুছে ফেলতে সমস্যা হয়েছে')
    }
  }

  async function toggleFeatured(doctor) {
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }
      const newFeaturedStatus = !doctor.is_featured
      const { error } = await supabase
        .from('doctors')
        .update({ is_featured: newFeaturedStatus })
        .eq('id', doctor.id)
      
      if (error) throw error
      fetchDoctors()
    } catch (error) {
      console.error('Error toggling featured:', error)
      alert('শীর্ষ স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে')
    }
  }

  async function toggleCategoryPromoted(doctor) {
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }
      const newPromotedStatus = !doctor.is_category_promoted
      const { error } = await supabase
        .from('doctors')
        .update({ is_category_promoted: newPromotedStatus })
        .eq('id', doctor.id)
      
      if (error) throw error
      fetchDoctors()
    } catch (error) {
      console.error('Error toggling category promoted:', error)
    }
  }

  async function toggleSerialEnabled(doctor) {
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }
      const currentStatus = doctor.is_serial_enabled ?? true
      const newSerialStatus = !currentStatus
      const { error } = await supabase
        .from('doctors')
        .update({ is_serial_enabled: newSerialStatus })
        .eq('id', doctor.id)
      
      if (error) throw error
      fetchDoctors()
    } catch (error) {
      console.error('Error toggling serial enabled:', error)
      alert('সিরিয়াল স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">ডাক্তার পরিচালনা</h1>
          <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            নতুন ডাক্তার
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : doctors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">কোনো ডাক্তার যোগ করা হয়নি</p>
            <button onClick={openAddModal} className="btn-primary mt-4">প্রথম ডাক্তার যোগ করুন</button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-6 py-4">নাম</th>
                  <th className="px-6 py-4">বিভাগ</th>
                  <th className="px-6 py-4">অ্যাক্সেস কোড</th>
                  <th className="px-6 py-4">স্ট্যাটাস</th>
                  <th className="px-6 py-4 text-center">শীর্ষ</th>
                  <th className="px-6 py-4 text-center">ক্যাটেগরি প্রমোট</th>
                  <th className="px-6 py-4 text-center">সিরিয়াল</th>
                  <th className="px-6 py-4">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(doctor => (
                  <tr key={doctor.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{doctor.name}</p>
                    </td>
                    <td className="px-6 py-4">{doctor.category_name}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{doctor.access_code || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${doctor.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {doctor.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => toggleFeatured(doctor)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                            doctor.is_featured ? 'bg-amber-500' : 'bg-gray-300'
                          }`}
                          title="শীর্ষে দেখান"
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
                              doctor.is_featured ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => toggleCategoryPromoted(doctor)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                            doctor.is_category_promoted ? 'bg-purple-500' : 'bg-gray-300'
                          }`}
                          title={`${doctor.category_name} ক্যাটেগরিতে প্রমোট করুন`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
                              doctor.is_category_promoted ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => toggleSerialEnabled(doctor)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                            (doctor.is_serial_enabled ?? true) ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                          title="সিরিয়াল নেওয়ার অপশন চালু/বন্ধ করুন"
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
                              (doctor.is_serial_enabled ?? true) ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => openEditModal(doctor)} className="text-primary-600 hover:underline text-sm">সম্পাদনা</button>
                        <button onClick={() => openExpertiseModal(doctor)} className="text-green-600 hover:underline text-sm">দক্ষতা</button>
                        <button onClick={() => openReviewModal(doctor)} className="text-purple-600 hover:underline text-sm">রিভিউ</button>
                        <button onClick={() => regenerateAccessCode(doctor.id)} className="text-amber-600 hover:underline text-sm">কোড রিসেট</button>
                        <button onClick={() => handleDelete(doctor.id)} className="text-red-600 hover:underline text-sm">মুছুন</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">
                {editingDoctor ? 'ডাক্তার সম্পাদনা' : 'নতুন ডাক্তার যোগ'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">নাম *</label>
                  <input type="text" name="name" required className="input-field" value={formData.name} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ডিগ্রি *</label>
                  <input type="text" name="degrees" required className="input-field" placeholder="MBBS, FCPS" value={formData.degrees} onChange={handleChange} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বর্তমান কর্মস্থল</label>
                <div className="space-y-2">
                  <div>
                    <input type="text" name="workplace_line1" className="input-field" placeholder="লাইন ১: যেমন: সহযোগী অধ্যাপক, মেডিসিন বিভাগ" value={formData.workplace_line1} onChange={handleChange} />
                    <p className="text-xs text-gray-500 mt-1">লাইন ১ (প্রধান)</p>
                  </div>
                  <div>
                    <input type="text" name="workplace_line2" className="input-field" placeholder="লাইন ২: যেমন: রংপুর মেডিকেল কলেজ হাসপাতাল" value={formData.workplace_line2} onChange={handleChange} />
                    <p className="text-xs text-gray-500 mt-1">লাইন ২ (ঐচ্ছিক)</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">বিভাগ *</label>
                  <select name="category" required className="input-field" value={formData.category} onChange={handleChange}>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">জেলা *</label>
                  <select name="district" required className="input-field" value={formData.district} onChange={handleChange}>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">চেম্বার ঠিকানা *</label>
                <input type="text" name="chamber_address" required className="input-field" value={formData.chamber_address} onChange={handleChange} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ফোন নম্বর</label>
                  <input type="tel" name="phone" className="input-field" value={formData.phone} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">পরামর্শ ফি (টাকা) *</label>
                  <input type="number" name="consultation_fee" required className="input-field" placeholder="যেমন: ৫০০" value={formData.consultation_fee} onChange={handleChange} />
                  <p className="text-xs text-gray-500 mt-1">শুধু সংখ্যা লিখুন</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">সাধারণ সিরিয়াল লিমিট</label>
                  <input type="number" name="daily_appointment_limit" min="1" className="input-field" placeholder="যেমন: ২০" value={formData.daily_appointment_limit} onChange={handleChange} />
                  <p className="text-xs text-gray-500 mt-1">প্রতিদিন সর্বোচ্চ সাধারণ সিরিয়াল</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">পেইড সিরিয়াল লিমিট</label>
                  <input type="number" name="paid_appointment_limit" min="1" className="input-field" placeholder="যেমন: ৫" value={formData.paid_appointment_limit} onChange={handleChange} />
                  <p className="text-xs text-gray-500 mt-1">প্রতিদিন সর্বোচ্চ পেইড সিরিয়াল</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">সময়সূচি</label>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">দিন নির্বাচন করুন:</p>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map(day => (
                        <label key={day.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${formData.schedule_days.includes(day.id) ? 'bg-primary-100 border-primary-500 text-primary-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                          <input 
                            type="checkbox" 
                            name="schedule_day" 
                            value={day.id}
                            checked={formData.schedule_days.includes(day.id)}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary-600"
                          />
                          <span className="text-sm font-medium">{day.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">সময়:</p>
                    <input type="text" name="schedule_time" className="input-field" placeholder="যেমন: সন্ধ্যা ৬টা - রাত ৯টা" value={formData.schedule_time} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পরিচিতি</label>
                <div className="bg-white rounded-lg border border-gray-200">
                  <Suspense fallback={<div className="p-4 text-gray-500">এডিটর লোড হচ্ছে...</div>}>
                    <ReactQuill
                      theme="snow"
                      value={formData.about}
                      onChange={(value) => setFormData({ ...formData, about: value })}
                      modules={{
                        toolbar: [
                          ['bold', 'italic', 'underline'],
                          [{ 'size': ['small', false, 'large', 'huge'] }],
                          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                          ['blockquote'],
                          ['clean']
                        ]
                      }}
                      formats={['bold', 'italic', 'underline', 'size', 'list', 'bullet', 'blockquote']}
                      placeholder="ডাক্তারের পরিচিতি লিখুন..."
                      className="min-h-[150px]"
                    />
                  </Suspense>
                </div>
                <p className="text-xs text-gray-500 mt-1">টেক্সট বোল্ড, ইটালিক, আন্ডারলাইন, ফন্ট সাইজ, বুলেট/নাম্বার লিস্ট, কোট ইত্যাদি যোগ করতে পারবেন</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ছবির URL</label>
                  <input type="url" name="image_url" className="input-field" placeholder="https://example.com/doctor-photo.jpg" value={formData.image_url} onChange={handleChange} />
                  <p className="text-xs text-gray-500 mt-1">ডাক্তারের ছবির লিংক দিন (ঐচ্ছিক)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ভিজিটিং কার্ড URL</label>
                  <input type="url" name="visiting_card_url" className="input-field" placeholder="https://example.com/visiting-card.jpg" value={formData.visiting_card_url} onChange={handleChange} />
                  <p className="text-xs text-gray-500 mt-1">ভিজিটিং কার্ডের ছবির লিংক (ঐচ্ছিক)</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">রেটিং (১-৫)</label>
                  <input type="number" name="rating" step="0.1" min="0" max="5" className="input-field" placeholder="4.5" value={formData.rating} onChange={handleChange} />
                  <p className="text-xs text-gray-500 mt-1">০ থেকে ৫ এর মধ্যে</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">রিভিউ সংখ্যা</label>
                  <input type="number" name="reviews_count" min="0" className="input-field" placeholder="150" value={formData.reviews_count} onChange={handleChange} />
                  <p className="text-xs text-gray-500 mt-1">মোট রিভিউ সংখ্যা</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">জরুরী বিজ্ঞপ্তি</label>
                <textarea name="notice" rows="2" className="input-field" placeholder="যেমন: ডাক্তার ছুটিতে আছেন / কনফারেন্সে আছেন" value={formData.notice} onChange={handleChange}></textarea>
                <p className="text-xs text-gray-500 mt-1">ডাক্তার ছুটি/কনফারেন্সে থাকলে এখানে লিখুন (ঐচ্ছিক)</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4" />
                  <label htmlFor="is_active" className="text-sm text-gray-700">সক্রিয় (রোগীরা দেখতে পাবে)</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="online_appointment" id="online_appointment" checked={formData.online_appointment} onChange={handleChange} className="w-4 h-4" />
                  <label htmlFor="online_appointment" className="text-sm text-gray-700">অনলাইন সিরিয়াল চালু</label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">বাতিল</button>
                <button type="submit" className="btn-primary flex-1">সংরক্ষণ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpertiseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                বিশেষজ্ঞতা ও দক্ষতা - {selectedDoctor?.name}
              </h2>
              <button onClick={() => setShowExpertiseModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleExpertiseSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3">{editingExpertise ? 'সম্পাদনা করুন' : 'নতুন দক্ষতা যোগ করুন'}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">শিরোনাম *</label>
                    <input 
                      type="text" 
                      required 
                      className="input-field" 
                      placeholder="যেমন: শিশু রোগ বিশেষজ্ঞ"
                      value={expertiseForm.title} 
                      onChange={(e) => setExpertiseForm({...expertiseForm, title: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">বিবরণ *</label>
                    <textarea 
                      required 
                      rows="2" 
                      className="input-field" 
                      placeholder="বিস্তারিত লিখুন..."
                      value={expertiseForm.description} 
                      onChange={(e) => setExpertiseForm({...expertiseForm, description: e.target.value})}
                    ></textarea>
                  </div>
                  <div className="flex gap-2">
                    {editingExpertise && (
                      <button 
                        type="button" 
                        onClick={() => { setEditingExpertise(null); setExpertiseForm({ title: '', description: '' }); }} 
                        className="btn-secondary"
                      >
                        বাতিল
                      </button>
                    )}
                    <button type="submit" className="btn-primary">
                      {editingExpertise ? 'আপডেট করুন' : 'যোগ করুন'}
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-3">
                <h3 className="font-semibold">যোগ করা দক্ষতাসমূহ ({expertiseList.length})</h3>
                {expertiseList.length === 0 ? (
                  <p className="text-gray-500 text-sm">কোনো দক্ষতা যোগ করা হয়নি</p>
                ) : (
                  expertiseList.map(item => (
                    <div key={item.id} className="p-4 bg-white border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-800">{item.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => editExpertise(item)} className="text-primary-600 hover:underline text-sm">সম্পাদনা</button>
                          <button onClick={() => handleDeleteExpertise(item.id)} className="text-red-600 hover:underline text-sm">মুছুন</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                রোগীদের রিভিউ - {selectedDoctor?.name}
              </h2>
              <button onClick={() => setShowReviewModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleReviewSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3">{editingReview ? 'সম্পাদনা করুন' : 'নতুন রিভিউ যোগ করুন'}</h3>
                <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">রোগীর নাম *</label>
                      <input 
                        type="text" 
                        required 
                        className="input-field" 
                        placeholder="যেমন: করিম সাহেব"
                        value={reviewForm.patient_name} 
                        onChange={(e) => setReviewForm({...reviewForm, patient_name: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">রেটিং *</label>
                      <select 
                        required 
                        className="input-field"
                        value={reviewForm.rating} 
                        onChange={(e) => setReviewForm({...reviewForm, rating: parseInt(e.target.value)})}
                      >
                        <option value="5">৫ স্টার</option>
                        <option value="4">৪ স্টার</option>
                        <option value="3">৩ স্টার</option>
                        <option value="2">২ স্টার</option>
                        <option value="1">১ স্টার</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">রিভিউ *</label>
                    <textarea 
                      required 
                      rows="3" 
                      className="input-field" 
                      placeholder="রোগীর মতামত লিখুন..."
                      value={reviewForm.review_text} 
                      onChange={(e) => setReviewForm({...reviewForm, review_text: e.target.value})}
                    ></textarea>
                  </div>
                  <div className="flex gap-2">
                    {editingReview && (
                      <button 
                        type="button" 
                        onClick={() => { setEditingReview(null); setReviewForm({ patient_name: '', rating: 5, review_text: '' }); }} 
                        className="btn-secondary"
                      >
                        বাতিল
                      </button>
                    )}
                    <button type="submit" className="btn-primary">
                      {editingReview ? 'আপডেট করুন' : 'যোগ করুন'}
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-3">
                <h3 className="font-semibold">যোগ করা রিভিউসমূহ ({reviewsList.length})</h3>
                {reviewsList.length === 0 ? (
                  <p className="text-gray-500 text-sm">কোনো রিভিউ যোগ করা হয়নি</p>
                ) : (
                  reviewsList.map(item => (
                    <div key={item.id} className="p-4 bg-white border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-800">{item.patient_name}</h4>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`w-4 h-4 ${star <= item.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm">{item.review_text}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button onClick={() => editReview(item)} className="text-primary-600 hover:underline text-sm">সম্পাদনা</button>
                          <button onClick={() => handleDeleteReview(item.id)} className="text-red-600 hover:underline text-sm">মুছুন</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDoctors
