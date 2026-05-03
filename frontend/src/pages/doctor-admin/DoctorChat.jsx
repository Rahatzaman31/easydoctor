import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'

function DoctorChat() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const subscriptionRef = useRef(null)
  const doctorId = localStorage.getItem('doctorId')

  useEffect(() => {
    if (!localStorage.getItem('doctorLoggedIn')) {
      navigate('/doctor.admin/login')
      return
    }
    fetchMessages()
    markMessagesAsRead()
    setupRealTimeSubscription()

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function fetchMessages() {
    try {
      if (!supabase || !isConfigured || !doctorId) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markMessagesAsRead() {
    try {
      if (!supabase || !isConfigured || !doctorId) return
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('doctor_id', doctorId)
        .eq('is_read', false)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
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

  function setupRealTimeSubscription() {
    if (!supabase || !isConfigured || !doctorId) return

    subscriptionRef.current = supabase
      .channel(`doctor-chat-${doctorId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `doctor_id=eq.${doctorId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
        if (payload.new.sender_type === 'admin') {
          markSingleMessageAsRead(payload.new.id)
        }
      })
      .subscribe()
  }

  async function handleSendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      if (!supabase || !isConfigured) {
        alert('ডাটাবেস সংযোগ নেই')
        return
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          doctor_id: doctorId,
          sender_type: 'doctor',
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
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="p-4 lg:p-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">এডমিনের সাথে চ্যাট</h1>
        <p className="text-gray-500 mt-1">এডমিনের সাথে যোগাযোগ করুন</p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg">কোনো মেসেজ নেই</p>
                <p className="text-sm">এডমিনের সাথে কথোপকথন শুরু করুন</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'doctor' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                      msg.sender_type === 'doctor'
                        ? 'bg-teal-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.sender_type === 'doctor' ? 'text-teal-200' : 'text-gray-400'}`}>
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
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
      )}
    </div>
  )
}

export default DoctorChat
