import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

function AdminChat() {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({})
  const messagesEndRef = useRef(null)
  const chatSubscriptionRef = useRef(null)
  const unreadSubscriptionRef = useRef(null)
  const selectedDoctorRef = useRef(null)

  useEffect(() => {
    selectedDoctorRef.current = selectedDoctor
  }, [selectedDoctor])

  useEffect(() => {
    if (!localStorage.getItem('adminLoggedIn')) {
      navigate('/admin/login')
      return
    }
    fetchDoctors()
    fetchUnreadCounts()
    setupUnreadSubscription()

    return () => {
      if (chatSubscriptionRef.current) {
        chatSubscriptionRef.current.unsubscribe()
      }
      if (unreadSubscriptionRef.current) {
        unreadSubscriptionRef.current.unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    if (selectedDoctor) {
      fetchMessages(selectedDoctor.id)
      markMessagesAsRead(selectedDoctor.id)
      setupChatSubscription(selectedDoctor.id)
    }
  }, [selectedDoctor])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function fetchDoctors() {
    try {
      if (!supabase || !isConfigured) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, image_url, category_name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setDoctors(data || [])
    } catch (error) {
      console.error('Error fetching doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUnreadCounts() {
    try {
      if (!supabase || !isConfigured) return
      const { data, error } = await supabase
        .from('chat_messages')
        .select('doctor_id')
        .eq('sender_type', 'doctor')
        .eq('is_read', false)

      if (error) throw error
      
      const counts = {}
      data?.forEach(msg => {
        counts[msg.doctor_id] = (counts[msg.doctor_id] || 0) + 1
      })
      setUnreadCounts(counts)
    } catch (error) {
      console.error('Error fetching unread counts:', error)
    }
  }

  async function fetchMessages(doctorId) {
    try {
      if (!supabase || !isConfigured) return
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  async function markMessagesAsRead(doctorId) {
    try {
      if (!supabase || !isConfigured) return
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('doctor_id', doctorId)
        .eq('sender_type', 'doctor')
        .eq('is_read', false)

      setUnreadCounts(prev => ({ ...prev, [doctorId]: 0 }))
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  function setupUnreadSubscription() {
    if (!supabase || !isConfigured) return

    unreadSubscriptionRef.current = supabase
      .channel('admin-unread-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        if (payload.new.sender_type === 'doctor') {
          const currentSelected = selectedDoctorRef.current
          if (!currentSelected || currentSelected.id !== payload.new.doctor_id) {
            setUnreadCounts(prev => ({
              ...prev,
              [payload.new.doctor_id]: (prev[payload.new.doctor_id] || 0) + 1
            }))
          }
        }
      })
      .subscribe()
  }

  function setupChatSubscription(doctorId) {
    if (!supabase || !isConfigured) return
    
    if (chatSubscriptionRef.current) {
      chatSubscriptionRef.current.unsubscribe()
    }

    chatSubscriptionRef.current = supabase
      .channel(`chat-${doctorId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `doctor_id=eq.${doctorId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
        if (payload.new.sender_type === 'doctor') {
          markSingleMessageAsRead(payload.new.id)
        }
      })
      .subscribe()
  }

  async function markSingleMessageAsRead(messageId) {
    try {
      if (!supabase || !isConfigured) return
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('id', messageId)
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedDoctor || sending) return

    setSending(true)
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          doctor_id: selectedDoctor.id,
          sender_type: 'admin',
          message: newMessage.trim(),
          is_read: false
        }])

      if (error) throw error
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('মেসেজ পাঠাতে সমস্যা হয়েছে')
    } finally {
      setSending(false)
    }
  }

  function formatTime(dateString) {
    const date = new Date(dateString)
    return date.toLocaleString('bn-BD', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className={`w-full lg:w-80 bg-white border-r border-gray-200 ${selectedDoctor ? 'hidden lg:block' : ''}`}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">ডাক্তারদের সাথে চ্যাট</h2>
            <p className="text-sm text-gray-500 mt-1">একজন ডাক্তার নির্বাচন করুন</p>
          </div>

          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[calc(100vh-120px)]">
              {doctors.map(doctor => (
                <button
                  key={doctor.id}
                  onClick={() => setSelectedDoctor(doctor)}
                  className={`w-full p-4 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedDoctor?.id === doctor.id ? 'bg-primary-50' : ''
                  }`}
                >
                  {doctor.image_url ? (
                    <img src={doctor.image_url} alt={doctor.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-2xl">
                      👨‍⚕️
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800">{doctor.name}</p>
                    <p className="text-sm text-gray-500">{doctor.category_name}</p>
                  </div>
                  {unreadCounts[doctor.id] > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {unreadCounts[doctor.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`flex-1 flex flex-col ${!selectedDoctor ? 'hidden lg:flex' : ''}`}>
          {selectedDoctor ? (
            <>
              <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {selectedDoctor.image_url ? (
                  <img src={selectedDoctor.image_url} alt={selectedDoctor.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-xl">
                    👨‍⚕️
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-800">{selectedDoctor.name}</p>
                  <p className="text-sm text-gray-500">{selectedDoctor.category_name}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>কোনো মেসেজ নেই</p>
                    <p className="text-sm">কথোপকথন শুরু করুন</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                          msg.sender_type === 'admin'
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.sender_type === 'admin' ? 'text-primary-200' : 'text-gray-400'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="মেসেজ লিখুন..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                    পাঠান
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg">একজন ডাক্তার নির্বাচন করুন</p>
                <p className="text-sm">চ্যাট শুরু করতে বাম দিক থেকে একজন ডাক্তার নির্বাচন করুন</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminChat
