import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { supabase, isConfigured } from '../../lib/supabase'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
}

const statusLabels = {
  pending: 'অপেক্ষমাণ',
  confirmed: 'নিশ্চিত',
  processing: 'প্রসেসিং',
  shipped: 'শিপড',
  delivered: 'ডেলিভার্ড',
  cancelled: 'বাতিল'
}

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700'
}

const paymentStatusLabels = {
  pending: 'অপেক্ষমাণ',
  completed: 'সম্পন্ন',
  failed: 'ব্যর্থ',
  refunded: 'ফেরত'
}

function AdminProductOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn')
    if (!isLoggedIn) {
      navigate('/admin/login')
      return
    }
    fetchOrders()
  }, [navigate])

  async function fetchOrders() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('product_orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      const { error } = await supabase
        .from('product_orders')
        .update({ order_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) throw error
      fetchOrders()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({...selectedOrder, order_status: newStatus})
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('অর্ডার আপডেট করতে সমস্যা হয়েছে।')
    }
  }

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.order_status === filterStatus)

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.order_status === 'pending').length,
    confirmed: orders.filter(o => o.order_status === 'confirmed').length,
    delivered: orders.filter(o => o.order_status === 'delivered').length,
    revenue: orders.filter(o => o.payment_status === 'completed').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
  }

  return (
    <AdminLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">পণ্য অর্ডার</h1>
          <p className="text-gray-600">গ্রাহকদের অর্ডার পরিচালনা করুন</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-sm text-gray-500">মোট অর্ডার</div>
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm">
            <div className="text-sm text-yellow-600">অপেক্ষমাণ</div>
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 shadow-sm">
            <div className="text-sm text-blue-600">নিশ্চিত</div>
            <div className="text-2xl font-bold text-blue-700">{stats.confirmed}</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-sm">
            <div className="text-sm text-green-600">ডেলিভার্ড</div>
            <div className="text-2xl font-bold text-green-700">{stats.delivered}</div>
          </div>
          <div className="bg-primary-50 rounded-xl p-4 shadow-sm">
            <div className="text-sm text-primary-600">মোট আয়</div>
            <div className="text-2xl font-bold text-primary-700">৳{stats.revenue}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            সকল
          </button>
          {Object.entries(statusLabels).map(([status, label]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === status ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8">লোড হচ্ছে...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">কোনো অর্ডার নেই</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">অর্ডার</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">গ্রাহক</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">মূল্য</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">পেমেন্ট</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">স্ট্যাটাস</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">তারিখ</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{order.order_number}</div>
                        <div className="text-sm text-gray-500">{order.product_name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{order.customer_name}</div>
                        <div className="text-sm text-gray-500">{order.customer_phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-primary-600">৳{order.total_amount}</div>
                        <div className="text-xs text-gray-500">
                          পণ্য: ৳{order.subtotal} | ডেলিভারি: ৳{order.delivery_charge}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${paymentStatusColors[order.payment_status] || 'bg-gray-100 text-gray-700'}`}>
                          {paymentStatusLabels[order.payment_status] || order.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={order.order_status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`px-2 py-1 rounded text-xs font-medium border-0 ${statusColors[order.order_status] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {Object.entries(statusLabels).map(([status, label]) => (
                            <option key={status} value={status}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('bn-BD')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-primary-600 hover:bg-primary-50 p-2 rounded"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">অর্ডার বিস্তারিত</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">অর্ডার নম্বর</div>
                  <div className="font-bold text-lg">{selectedOrder.order_number}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">পণ্য</div>
                    <div className="font-medium">{selectedOrder.product_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">পরিমাণ</div>
                    <div className="font-medium">{selectedOrder.quantity}টি</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">গ্রাহক তথ্য</div>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">নাম:</span> {selectedOrder.customer_name}</div>
                    <div><span className="text-gray-500">ফোন:</span> {selectedOrder.customer_phone}</div>
                    {selectedOrder.customer_email && (
                      <div><span className="text-gray-500">ইমেইল:</span> {selectedOrder.customer_email}</div>
                    )}
                    <div><span className="text-gray-500">এলাকা:</span> {selectedOrder.delivery_area === 'rangpur' ? 'রংপুর শহর' : 'রংপুরের বাইরে'}</div>
                    <div><span className="text-gray-500">ঠিকানা:</span> {selectedOrder.delivery_address}</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">মূল্য বিবরণ</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">পণ্য মূল্য</span>
                      <span>৳{selectedOrder.product_price} × {selectedOrder.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">সাবটোটাল</span>
                      <span>৳{selectedOrder.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">ডেলিভারি চার্জ</span>
                      <span>৳{selectedOrder.delivery_charge}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>মোট</span>
                      <span className="text-primary-600">৳{selectedOrder.total_amount}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">পেমেন্ট তথ্য</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">পদ্ধতি</span>
                      <span>{selectedOrder.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">স্ট্যাটাস</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${paymentStatusColors[selectedOrder.payment_status]}`}>
                        {paymentStatusLabels[selectedOrder.payment_status]}
                      </span>
                    </div>
                    {selectedOrder.bkash_trx_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">TrxID</span>
                        <span className="font-mono">{selectedOrder.bkash_trx_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedOrder.order_notes && (
                  <div className="border-t pt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">গ্রাহক মন্তব্য</div>
                    <p className="text-sm text-gray-600">{selectedOrder.order_notes}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">অর্ডার স্ট্যাটাস পরিবর্তন করুন</div>
                  <select
                    value={selectedOrder.order_status}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <option key={status} value={status}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminProductOrders
