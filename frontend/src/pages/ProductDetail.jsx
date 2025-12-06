import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    reviewer_name: '',
    reviewer_phone: '',
    reviewer_location: '',
    rating: 5,
    review_text: ''
  })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    delivery_area: 'rangpur',
    order_notes: ''
  })
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    fetchProduct()
  }, [id])

  async function fetchProduct() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (productError) throw productError
      setProduct(productData)

      const { data: reviewsData } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', id)
        .or('is_approved.eq.true,is_admin_review.eq.true')
        .order('created_at', { ascending: false })

      setReviews(reviewsData || [])

      if (productData?.category) {
        const { data: relatedData } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('category', productData.category)
          .neq('id', id)
          .limit(4)

        setRelatedProducts(relatedData || [])
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault()
    if (!reviewForm.reviewer_name || !reviewForm.review_text) {
      alert('অনুগ্রহ করে নাম এবং রিভিউ লিখুন')
      return
    }

    setReviewSubmitting(true)
    try {
      const { error } = await supabase.from('product_reviews').insert([{
        product_id: id,
        ...reviewForm,
        is_approved: false,
        is_admin_review: false
      }])

      if (error) throw error
      setReviewSuccess(true)
      setReviewForm({
        reviewer_name: '',
        reviewer_phone: '',
        reviewer_location: '',
        rating: 5,
        review_text: ''
      })
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('রিভিউ জমা দিতে সমস্যা হয়েছে।')
    } finally {
      setReviewSubmitting(false)
    }
  }

  async function initiatePayment() {
    setOrderSubmitting(true)
    try {
      const deliveryCharge = orderForm.delivery_area === 'rangpur' ? 0 : 150
      const subtotal = (product.sale_price || product.price) * quantity
      const totalAmount = subtotal + deliveryCharge
      const orderNumber = 'ORD' + Date.now().toString().slice(-8)

      sessionStorage.setItem('pendingProductOrder', JSON.stringify({
        orderForm,
        productId: id,
        productName: product.name,
        productPrice: product.sale_price || product.price,
        quantity,
        deliveryCharge,
        subtotal,
        totalAmount,
        orderNumber
      }))

      const response = await fetch('/api/bkash/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: totalAmount,
          payerReference: orderForm.customer_phone,
          merchantInvoiceNumber: orderNumber,
          paymentType: 'product'
        })
      })

      const data = await response.json()

      if (data.success && data.bkashURL) {
        sessionStorage.setItem('paymentType', 'product_order')
        window.location.href = data.bkashURL
      } else {
        sessionStorage.removeItem('pendingProductOrder')
        alert(data.message || 'পেমেন্ট শুরু করতে সমস্যা হয়েছে।')
      }
    } catch (error) {
      console.error('Payment error:', error)
      sessionStorage.removeItem('pendingProductOrder')
      alert('পেমেন্ট শুরু করতে সমস্যা হয়েছে।')
    } finally {
      setOrderSubmitting(false)
    }
  }

  const deliveryCharge = orderForm.delivery_area === 'rangpur' ? 0 : 150
  const subtotal = product ? (product.sale_price || product.price) * quantity : 0
  const totalAmount = subtotal + deliveryCharge

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-200 rounded-2xl h-96"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">পণ্য পাওয়া যায়নি</h2>
          <Link to="/medi-products" className="text-primary-600 hover:underline">
            সকল পণ্য দেখুন
          </Link>
        </div>
      </div>
    )
  }

  const hasDiscount = product.sale_price && product.sale_price < product.price
  const discountPercentage = hasDiscount 
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0

  const images = [product.image_url, ...(product.additional_images || [])].filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-primary-600">হোম</Link>
            <span className="text-gray-300">/</span>
            <Link to="/medi-products" className="text-gray-500 hover:text-primary-600">মেডি পণ্য</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-800 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
            <div>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-4">
                <img 
                  src={images[selectedImage] || 'https://via.placeholder.com/500'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white font-bold px-3 py-1 rounded-full">
                    -{discountPercentage}% ছাড়
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? 'border-primary-500' : 'border-gray-200'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                {product.category && (
                  <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                    {product.category}
                  </span>
                )}
                {product.is_featured && (
                  <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    জনপ্রিয়
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star}
                      className={`w-5 h-5 ${star <= Math.round(product.average_rating || 0) ? 'text-amber-400' : 'text-gray-200'}`}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-600">
                  ({reviews.length} রিভিউ)
                </span>
              </div>

              <div className="flex items-baseline gap-4 mb-6">
                {hasDiscount ? (
                  <>
                    <span className="text-3xl font-bold text-primary-600">৳{product.sale_price}</span>
                    <span className="text-xl text-gray-400 line-through">৳{product.price}</span>
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-medium">
                      {discountPercentage}% ছাড়
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-primary-600">৳{product.price}</span>
                )}
              </div>

              {product.short_description && (
                <p className="text-gray-600 mb-6">{product.short_description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-green-800">১০০% অরিজিনাল</div>
                    <div className="text-sm text-green-600">গুণগত মান নিশ্চিত</div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-blue-800">দ্রুত ডেলিভারি</div>
                    <div className="text-sm text-blue-600">রংপুরে ফ্রি</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-gray-700 font-medium">পরিমাণ:</span>
                <div className="flex items-center border border-gray-200 rounded-xl">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                {product.stock_quantity > 0 && (
                  <span className="text-green-600 text-sm">
                    স্টকে আছে ({product.stock_quantity}টি)
                  </span>
                )}
              </div>

              <button
                onClick={() => setShowOrderModal(true)}
                className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                এখনই অর্ডার করুন
              </button>

              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>বিকাশে পেমেন্ট করুন</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm mt-8 overflow-hidden">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'description'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                বিবরণ
              </button>
              <button
                onClick={() => setActiveTab('usage')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'usage'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ব্যবহার বিধি
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'reviews'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                রিভিউ ({reviews.length})
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description || 'বিবরণ পাওয়া যায়নি।'}
                </p>
                {product.ingredients && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-800 mb-2">উপাদান</h4>
                    <p className="text-gray-600">{product.ingredients}</p>
                  </div>
                )}
                {product.manufacturer && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-800 mb-2">প্রস্তুতকারক</h4>
                    <p className="text-gray-600">{product.manufacturer}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'usage' && (
              <div>
                {product.usage_instructions ? (
                  <div className="bg-primary-50 rounded-xl p-6">
                    <h4 className="font-semibold text-primary-800 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ব্যবহার বিধি
                    </h4>
                    <p className="text-primary-700">{product.usage_instructions}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">ব্যবহার বিধি পাওয়া যায়নি।</p>
                )}
                {product.warnings && (
                  <div className="bg-red-50 rounded-xl p-6 mt-4">
                    <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      সতর্কতা
                    </h4>
                    <p className="text-red-700">{product.warnings}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-semibold text-gray-800">গ্রাহক রিভিউ</h4>
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
                  >
                    রিভিউ লিখুন
                  </button>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-100 pb-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">{review.reviewer_name}</span>
                              {review.is_verified_purchase && (
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                                  যাচাইকৃত ক্রেতা
                                </span>
                              )}
                            </div>
                            {review.reviewer_location && (
                              <span className="text-sm text-gray-500">{review.reviewer_location}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
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
                        </div>
                        <p className="text-gray-700">{review.review_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    এই পণ্যে এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">সম্পর্কিত পণ্য</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">রিভিউ লিখুন</h3>
                <button onClick={() => { setShowReviewModal(false); setReviewSuccess(false) }} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {reviewSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">রিভিউ সফলভাবে জমা হয়েছে!</h4>
                  <p className="text-gray-600">এডমিন অ্যাপ্রুভ করার পর আপনার রিভিউ দেখা যাবে।</p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">আপনার নাম *</label>
                    <input
                      type="text"
                      value={reviewForm.reviewer_name}
                      onChange={(e) => setReviewForm({...reviewForm, reviewer_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ফোন নম্বর</label>
                    <input
                      type="tel"
                      value={reviewForm.reviewer_phone}
                      onChange={(e) => setReviewForm({...reviewForm, reviewer_phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">অবস্থান</label>
                    <input
                      type="text"
                      value={reviewForm.reviewer_location}
                      onChange={(e) => setReviewForm({...reviewForm, reviewer_location: e.target.value})}
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
                          onClick={() => setReviewForm({...reviewForm, rating: star})}
                          className="p-1"
                        >
                          <svg 
                            className={`w-8 h-8 ${star <= reviewForm.rating ? 'text-amber-400' : 'text-gray-200'}`}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">আপনার রিভিউ *</label>
                    <textarea
                      value={reviewForm.review_text}
                      onChange={(e) => setReviewForm({...reviewForm, review_text: e.target.value})}
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                  >
                    {reviewSubmitting ? 'জমা দেওয়া হচ্ছে...' : 'রিভিউ জমা দিন'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">অর্ডার করুন</h3>
                <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex gap-4">
                  <img 
                    src={product.image_url}
                    alt={product.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-800">{product.name}</h4>
                    <p className="text-primary-600 font-bold">
                      ৳{product.sale_price || product.price} × {quantity}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); initiatePayment(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">আপনার নাম *</label>
                  <input
                    type="text"
                    value={orderForm.customer_name}
                    onChange={(e) => setOrderForm({...orderForm, customer_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ফোন নম্বর *</label>
                  <input
                    type="tel"
                    value={orderForm.customer_phone}
                    onChange={(e) => setOrderForm({...orderForm, customer_phone: e.target.value})}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল (ঐচ্ছিক)</label>
                  <input
                    type="email"
                    value={orderForm.customer_email}
                    onChange={(e) => setOrderForm({...orderForm, customer_email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ডেলিভারি এলাকা *</label>
                  <select
                    value={orderForm.delivery_area}
                    onChange={(e) => setOrderForm({...orderForm, delivery_area: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="rangpur">রংপুর শহর (ফ্রি ডেলিভারি)</option>
                    <option value="outside_rangpur">রংপুরের বাইরে (৳১৫০ ডেলিভারি চার্জ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">সম্পূর্ণ ঠিকানা *</label>
                  <textarea
                    value={orderForm.delivery_address}
                    onChange={(e) => setOrderForm({...orderForm, delivery_address: e.target.value})}
                    rows="3"
                    placeholder="বাড়ি নম্বর, রোড, এলাকা, জেলা"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">অতিরিক্ত মন্তব্য (ঐচ্ছিক)</label>
                  <textarea
                    value={orderForm.order_notes}
                    onChange={(e) => setOrderForm({...orderForm, order_notes: e.target.value})}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  ></textarea>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>সাবটোটাল ({quantity}টি পণ্য)</span>
                    <span>৳{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>ডেলিভারি চার্জ</span>
                    <span className={deliveryCharge === 0 ? 'text-green-600' : ''}>
                      {deliveryCharge === 0 ? 'ফ্রি' : `৳${deliveryCharge}`}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-gray-800">
                    <span>মোট</span>
                    <span className="text-primary-600">৳{totalAmount}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="w-full bg-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {orderSubmitting ? (
                    'প্রসেসিং...'
                  ) : (
                    <>
                      <img src="https://www.bkash.com/sites/all/themes/flavor/images/bkash_logo.svg" alt="bKash" className="h-6" />
                      বিকাশে পেমেন্ট করুন
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default ProductDetail
