import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

const defaultCategories = [
  { id: 'medicine', name: 'মেডিসিন বিশেষজ্ঞ', icon: '/icons/medicine.png', isImage: true },
  { id: 'cardiology', name: 'হৃদরোগ বিশেষজ্ঞ', icon: '/icons/cardiology.png', isImage: true },
  { id: 'neurology', name: 'মস্তিষ্ক ও স্নায়ু রোগ বিশেষজ্ঞ', icon: '/icons/neurology.png', isImage: true },
  { id: 'gynecology', name: 'প্রসূতি ও স্ত্রীরোগ বিশেষজ্ঞ', icon: '/icons/gynecology.png', isImage: true },
  { id: 'pediatrics', name: 'শিশু রোগ বিশেষজ্ঞ', icon: '/icons/pediatrics.png', isImage: true },
  { id: 'orthopedics', name: 'হাড় ও জয়েন্ট রোগ বিশেষজ্ঞ', icon: '/icons/orthopedics.png', isImage: true },
  { id: 'ent', name: 'নাক-কান-গলা বিশেষজ্ঞ', icon: '/icons/ent.png', isImage: true },
  { id: 'dermatology', name: 'চর্মরোগ বিশেষজ্ঞ', icon: '/icons/dermatology.png', isImage: true },
  { id: 'psychiatry', name: 'মানসিক রোগ বিশেষজ্ঞ', icon: '/icons/psychiatry.png', isImage: true },
  { id: 'ophthalmology', name: 'চক্ষু রোগ বিশেষজ্ঞ', icon: '/icons/ophthalmology.png', isImage: true },
  { id: 'dental', name: 'দন্ত বিশেষজ্ঞ', icon: '/icons/dental.png', isImage: true },
  { id: 'surgery', name: 'সার্জারি বিশেষজ্ঞ', icon: '/icons/surgery.png', isImage: true },
  { id: 'oncology', name: 'ক্যান্সার রোগ বিশেষজ্ঞ', icon: '/icons/oncology.png', isImage: true },
  { id: 'pulmonology', name: 'শ্বাসতন্ত্র রোগ বিশেষজ্ঞ', icon: '/icons/pulmonology.png', isImage: true },
  { id: 'endocrinology', name: 'হরমোন রোগ বিশেষজ্ঞ', icon: '/icons/endocrinology.png', isImage: true },
  { id: 'anesthesia', name: 'চেতনানাশক বিশেষজ্ঞ', icon: '/icons/anesthesia.png', isImage: true },
  { id: 'nephrology', name: 'কিডনি রোগ বিশেষজ্ঞ', icon: '/icons/kidney.png', isImage: true },
  { id: 'urology', name: 'মূত্রতন্ত্র রোগ বিশেষজ্ঞ', icon: '/icons/urology.png', isImage: true },
  { id: 'gastroenterology', name: 'পরিপাকতন্ত্র বিশেষজ্ঞ', icon: '/icons/gastroenterology.png', isImage: true },
  { id: 'rheumatology', name: 'বাত রোগ বিশেষজ্ঞ', icon: '/icons/rheumatology.png', isImage: true },
  { id: 'diabetes', name: 'ডায়াবেটিস বিশেষজ্ঞ', icon: '/icons/diabetes.png', isImage: true },
  { id: 'plastic-surgery', name: 'প্লাস্টিক সার্জন', icon: '/icons/plastic-surgery.png', isImage: true },
  { id: 'physiotherapy', name: 'ফিজিওথেরাপিস্ট', icon: '/icons/physiotherapy.png', isImage: true },
  { id: 'nutrition', name: 'পুষ্টিবিদ', icon: '/icons/nutrition.png', isImage: true },
]

function AdminCategories() {
  const navigate = useNavigate()
  const [doctorCounts, setDoctorCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchDoctorCounts()
  }, [])

  async function fetchDoctorCounts() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('doctors')
        .select('category')
      
      if (error) throw error
      
      const counts = {}
      data?.forEach(doc => {
        counts[doc.category] = (counts[doc.category] || 0) + 1
      })
      setDoctorCounts(counts)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">বিভাগসমূহ</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <p className="text-gray-600">
            এই বিভাগগুলো সিস্টেমে ডিফল্ট হিসেবে সেট করা আছে। প্রতিটি বিভাগে কতজন ডাক্তার আছেন তা নিচে দেখানো হয়েছে।
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {defaultCategories.map(cat => (
              <div key={cat.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <img src={cat.icon} alt={cat.name} className="w-10 h-10" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{cat.name}</h3>
                    <p className="text-sm text-gray-500">{cat.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-gray-600">ডাক্তার সংখ্যা:</span>
                  <span className="text-2xl font-bold text-primary-600">{doctorCounts[cat.id] || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCategories
