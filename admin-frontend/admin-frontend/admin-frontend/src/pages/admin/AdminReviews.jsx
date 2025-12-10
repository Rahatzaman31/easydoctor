import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminReviews() {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchReviews()
  }, [filter])

  async function fetchReviews() {
    try {
      setLoading(true)
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }
      
      let query = supabase
        .from('doctor_reviews')
        .select(`
          *,
          doctors:doctor_id (name, category_name)
        `)
        .order('created_at', { ascending: false })
      
      if (filter !== 'all') {
        query = query.eq('status', filter)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(reviewId) {
    try {
      if (!supabase || !isConfigured) return
      
      const { error } = await supabase
        .from('doctor_reviews')
        .update({ status: 'approved' })
        .eq('id', reviewId)
      
      if (error) throw error
      fetchReviews()
    } catch (error) {
      console.error('Error approving review:', error)
      alert('অনুমোদন করতে সমস্যা হয়েছে')
    }
  }

  async function handleReject(reviewId) {
    if (!confirm('আপনি কি নিশ্চিত যে এই রিভিউটি বাতিল করতে চান? এটি স্থায়ীভাবে মুছে যাবে।')) return
    
    try {
      if (!supabase || !isConfigured) return
      
      const { error } = await supabase
        .from('doctor_reviews')
        .delete()
        .eq('id', reviewId)
      
      if (error) throw error
      fetchReviews()
    } catch (error) {
      console.error('Error rejecting review:', error)
      alert('বাতিল করতে সমস্যা হয়েছে')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">অপেক্ষমাণ</span>
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">অনুমোদিত</span>
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">{status}</span>
    }
  }

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">রিভিউ ম্যানেজমেন্ট</h1>
          <p className="text-gray-600 mt-2">রোগীদের রিভিউ পর্যালোচনা ও অনুমোদন করুন</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                অপেক্ষমাণ
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                অনুমোদিত
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                সকল
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">লোড হচ্ছে...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-gray-500">কোনো রিভিউ পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0 shadow">
                      <span className="text-white font-bold text-lg">
                        {review.patient_name?.charAt(0) || 'র'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800">{review.patient_name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span>{review.email}</span>
                            <span>|</span>
                            <span>{review.phone}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {renderStars(review.rating)}
                          {getStatusBadge(review.status)}
                        </div>
                      </div>
                      
                      <div className="bg-gray-100 rounded-lg p-3 mb-3">
                        <p className="text-gray-600 text-sm">
                          <span className="font-medium text-gray-700">ডাক্তার:</span> {review.doctors?.name || 'N/A'} ({review.doctors?.category_name || ''})
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          <span className="font-medium text-gray-700">অ্যাপয়েন্টমেন্ট কোড:</span> {review.appointment_code || 'N/A'}
                        </p>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed mb-4">{review.review_text}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          {new Date(review.created_at).toLocaleDateString('bn-BD', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        
                        {review.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(review.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              অনুমোদন
                            </button>
                            <button
                              onClick={() => handleReject(review.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              বাতিল
                            </button>
                          </div>
                        )}
                        
                        {review.status === 'approved' && (
                          <button
                            onClick={() => handleReject(review.id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            মুছে ফেলুন
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminReviews
