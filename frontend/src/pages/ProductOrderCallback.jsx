import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || '';

function ProductOrderCallback() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const paymentProcessedRef = useRef(false)

  useEffect(() => {
    if (paymentProcessedRef.current) {
      console.log('Payment already being processed, skipping...')
      return
    }

    const urlParams = new URLSearchParams(window.location.search)
    const paymentID = urlParams.get('paymentID')
    const status = urlParams.get('status')

    if (paymentID && status) {
      const callbackKey = `product_order_callback_${paymentID}`
      const callbackStatus = sessionStorage.getItem(callbackKey)

      if (callbackStatus === 'completed' || callbackStatus === 'processing') {
        console.log('Payment callback already processed or in progress')
        setLoading(false)
        return
      }

      paymentProcessedRef.current = true
      sessionStorage.setItem(callbackKey, 'processing')
      handleCallback(paymentID, status, callbackKey)
    } else {
      setError('পেমেন্ট তথ্য পাওয়া যায়নি।')
      setLoading(false)
    }
  }, [])

  async function handleCallback(paymentID, status, callbackKey) {
    const savedData = sessionStorage.getItem('pendingProductOrder')

    if (!savedData) {
      setError('সেশন ডাটা পাওয়া যায়নি। অনুগ্রহ করে আবার অর্ডার করুন।')
      setLoading(false)
      return
    }

    if (status === 'success') {
      try {
        const response = await fetch(`${API_URL}/api/bkash/execute-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ paymentID })
        })

        const data = await response.json()

        if (data.success) {
          setTransactionId(data.trxID)
          await saveOrder(data.trxID, paymentID, savedData, callbackKey)
        } else {
          setError(data.message || 'পেমেন্ট যাচাই করতে সমস্যা হয়েছে।')
          if (callbackKey) sessionStorage.removeItem(callbackKey)
        }
      } catch (err) {
        console.error('Execute payment error:', err)
        setError('পেমেন্ট যাচাই করতে সমস্যা হয়েছে।')
        if (callbackKey) sessionStorage.removeItem(callbackKey)
      }
    } else if (status === 'failure' || status === 'cancel') {
      setError('পেমেন্ট বাতিল হয়েছে বা ব্যর্থ হয়েছে।')
      if (callbackKey) sessionStorage.removeItem(callbackKey)
    }

    setLoading(false)
  }

  async function saveOrder(trxID, paymentID, savedDataStr, callbackKey) {
    try {
      const savedData = JSON.parse(savedDataStr)

      if (!supabase || !isConfigured) {
        setError('ডাটাবেস সংযোগ নেই।')
        if (callbackKey) sessionStorage.removeItem(callbackKey)
        return
      }

      const { error } = await supabase.from('product_orders').insert([{
        order_number: savedData.orderNumber,
        product_id: savedData.productId,
        product_name: savedData.productName,
        product_price: savedData.productPrice,
        quantity: savedData.quantity,
        customer_name: savedData.orderForm.customer_name,
        customer_phone: savedData.orderForm.customer_phone,
        customer_email: savedData.orderForm.customer_email || null,
        delivery_address: savedData.orderForm.delivery_address,
        delivery_area: savedData.orderForm.delivery_area,
        delivery_charge: savedData.deliveryCharge,
        subtotal: savedData.subtotal,
        total_amount: savedData.totalAmount,
        payment_method: 'bkash',
        payment_status: 'completed',
        bkash_payment_id: paymentID,
        bkash_trx_id: trxID,
        order_status: 'confirmed',
        order_notes: savedData.orderForm.order_notes || null
      }])

      if (error) throw error

      if (callbackKey) {
        sessionStorage.setItem(callbackKey, 'completed')
      }
      sessionStorage.removeItem('pendingProductOrder')
      sessionStorage.removeItem('paymentType')

      setOrderNumber(savedData.orderNumber)
      setSuccess(true)

    } catch (err) {
      console.error('Save order error:', err)
      setError('অর্ডার সংরক্ষণ করতে সমস্যা হয়েছে। অনুগ্রহ করে যোগাযোগ করুন।')
      if (callbackKey) sessionStorage.removeItem(callbackKey)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">পেমেন্ট যাচাই করা হচ্ছে...</h2>
          <p className="text-gray-500">অনুগ্রহ করে অপেক্ষা করুন</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">অর্ডার ব্যর্থ হয়েছে</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/medi-products"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700"
          >
            পুনরায় চেষ্টা করুন
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">অর্ডার সফল!</h2>
          <p className="text-gray-600 mb-6">আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে। শীঘ্রই আমরা আপনার সাথে যোগাযোগ করব।</p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500">অর্ডার নম্বর</span>
              <span className="font-bold text-gray-800">{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ট্রানজেকশন ID</span>
              <span className="font-mono text-sm text-gray-800">{transactionId}</span>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-blue-700 text-sm">
              অনুগ্রহ করে এই তথ্যগুলো সংরক্ষণ করুন। ডেলিভারির সময় প্রয়োজন হতে পারে।
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to="/medi-products"
              className="block w-full bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700"
            >
              আরো পণ্য দেখুন
            </Link>
            <Link
              to="/"
              className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200"
            >
              হোম পেজে যান
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default ProductOrderCallback
