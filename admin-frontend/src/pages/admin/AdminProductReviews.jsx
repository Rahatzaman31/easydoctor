import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { supabase, isConfigured } from '../../lib/supabase'

function AdminProductReviews() {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterApproved, setFilterApproved] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    product_id: '',
    reviewer_name: '',
    reviewer_location: '',
    rating: 5,
    review_text: '',
    is_verified_purchase: true,
    is_admin_review: true,
    is_approved: true
  })

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      navigate('/admin/login')
      return
    }
    fetchReviews()
    fetchProducts()
  }, [navigate])

  async function fetchProducts() {
    try {
      if (!supabase || !isConfigured) return

      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true)

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  async function fetchReviews() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          products (name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleApproval(reviewId, currentStatus) {
    try {
      const { error } = await supabase
        .from('product_reviews')
        .update({ is_approved: !currentStatus })
        .eq('id', reviewId)

      if (error) throw error
      fetchReviews()
    } catch (error) {
      console.error('Error updating review:', error)
    }
  }

  async function deleteReview(id) {
    if (!confirm('আপনি কি নিশ্চিত যে এই রিভিউটি মুছে ফেলতে চান?')) return

    try {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchReviews()
    } catch (error) {
      console.error('Error deleting review:', error)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert([formData])

      if (error) throw error
      
      setShowModal(false)
      setFormData({
        product_id: '',
        reviewer_name: '',
        reviewer_location: '',
        rating: 5,
        review_text: '',
        is_verified_purchase: true,
        is_admin_review: true,
        is_approved: true
      })
      fetchReviews()
    } catch (error) {
      console.error('Error adding review:', error)
      alert('রিভিউ যোগ করতে সমস্যা হয়েছে।')
    }
  }

  const filteredReviews = filterApproved === 'all' 
    ? reviews 
    : filterApproved === 'approved'
      ? reviews.filter(r => r.is_approved)
      : reviews.filter(r => !r.is_approved)

  return (
    <AdminLayout>
      <div className="p-4 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">পণ্য রিভিউ</h1>
            <p className="text-gray-600">গ্রাহক রিভিউ পরিচালনা ও অ্যাপ্রুভ করুন</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            এডমিন রিভিউ যোগ করুন
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilterApproved('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filterApproved === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            সকল ({reviews.length})
          </button>
          <button
            onClick={() => setFilterApproved('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filterApproved === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            অপেক্ষমাণ ({reviews.filter(r => !r.is_approved).length})
          </button>
          <button
            onClick={() => setFilterApproved('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filterApproved === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            অনুমোদিত ({reviews.filter(r => r.is_approved).length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">লোড হচ্ছে...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">কোনো রিভিউ নেই</div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-800">{review.reviewer_name}</span>
                      {review.is_admin_review && (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">এডমিন</span>
                      )}
                      {review.is_verified_purchase && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">যাচাইকৃত</span>
                      )}
                      {review.reviewer_location && (
                        <span className="text-sm text-gray-500">- {review.reviewer_location}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400' : 'text-gray-200'}`}
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700 mb-2">{review.review_text}</p>
                    <div className="text-sm text-gray-500">
                      পণ্য: <span className="font-medium text-gray-700">{review.products?.name || 'N/A'}</span> | 
                      তারিখ: {new Date(review.created_at).toLocaleDateString('bn-BD')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleApproval(review.id, review.is_approved)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        review.is_approved
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {review.is_approved ? 'অনুমোদন বাতিল' : 'অনুমোদন দিন'}
                    </button>
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">এডমিন রিভিউ যোগ করুন</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">পণ্য নির্বাচন করুন *</label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">পণ্য নির্বাচন করুন</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">রিভিউয়ারের নাম *</label>
                  <input
                    type="text"
                    value={formData.reviewer_name}
                    onChange={(e) => setFormData({...formData, reviewer_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">অবস্থান</label>
                  <input
                    type="text"
                    value={formData.reviewer_location}
                    onChange={(e) => setFormData({...formData, reviewer_location: e.target.value})}
                    placeholder="যেমন: রংপুর সদর"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">রেটিং *</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({...formData, rating: star})}
                        className="p-1"
                      >
                        <svg 
                          className={`w-8 h-8 ${star <= formData.rating ? 'text-amber-400' : 'text-gray-200'}`}
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">রিভিউ *</label>
                  <textarea
                    value={formData.review_text}
                    onChange={(e) => setFormData({...formData, review_text: e.target.value})}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  ></textarea>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_verified_purchase}
                      onChange={(e) => setFormData({...formData, is_verified_purchase: e.target.checked})}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm text-gray-700">যাচাইকৃত ক্রেতা</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700"
                >
                  রিভিউ যোগ করুন
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminProductReviews
