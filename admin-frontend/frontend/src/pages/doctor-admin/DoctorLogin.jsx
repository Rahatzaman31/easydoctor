import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../../lib/supabase'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000

function DoctorLogin() {
  const navigate = useNavigate()
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState(null)
  const [remainingTime, setRemainingTime] = useState(0)

  useEffect(() => {
    const storedAttempts = localStorage.getItem('doctorLoginAttempts')
    const storedLockout = localStorage.getItem('doctorLoginLockout')
    
    if (storedAttempts) setAttempts(parseInt(storedAttempts))
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout)
      if (lockoutTime > Date.now()) {
        setLockoutUntil(lockoutTime)
      } else {
        localStorage.removeItem('doctorLoginAttempts')
        localStorage.removeItem('doctorLoginLockout')
      }
    }
  }, [])

  useEffect(() => {
    if (lockoutUntil && lockoutUntil > Date.now()) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000)
        if (remaining <= 0) {
          setLockoutUntil(null)
          setAttempts(0)
          localStorage.removeItem('doctorLoginAttempts')
          localStorage.removeItem('doctorLoginLockout')
        } else {
          setRemainingTime(remaining)
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [lockoutUntil])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (lockoutUntil && lockoutUntil > Date.now()) {
      const mins = Math.ceil(remainingTime / 60)
      setError(`অনেক বেশি ভুল প্রচেষ্টা। ${mins} মিনিট পর আবার চেষ্টা করুন।`)
      return
    }

    setLoading(true)

    try {
      if (!supabase || !isConfigured) {
        setError('ডাটাবেস সংযোগ নেই')
        setLoading(false)
        return
      }

      if (accessCode.length !== 6) {
        setError('অনুগ্রহ করে ৬ অক্ষরের কোড দিন')
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('doctors')
        .select('*')
        .eq('access_code', accessCode)
        .eq('is_active', true)
        .single()

      if (fetchError || !data) {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        localStorage.setItem('doctorLoginAttempts', newAttempts.toString())
        
        if (newAttempts >= MAX_ATTEMPTS) {
          const lockoutTime = Date.now() + LOCKOUT_DURATION
          setLockoutUntil(lockoutTime)
          localStorage.setItem('doctorLoginLockout', lockoutTime.toString())
          setError(`অনেক বেশি ভুল প্রচেষ্টা। ১৫ মিনিট পর আবার চেষ্টা করুন।`)
        } else {
          setError(`ভুল কোড। আর ${MAX_ATTEMPTS - newAttempts} বার চেষ্টা করতে পারবেন।`)
        }
        setLoading(false)
        return
      }

      localStorage.removeItem('doctorLoginAttempts')
      localStorage.removeItem('doctorLoginLockout')
      setAttempts(0)

      localStorage.setItem('doctorLoggedIn', 'true')
      localStorage.setItem('doctorId', data.id.toString())
      localStorage.setItem('doctorName', data.name)
      localStorage.setItem('doctorLoginTime', Date.now().toString())

      navigate('/doctor.admin')
    } catch (err) {
      console.error('Login error:', err)
      setError('লগইন করতে সমস্যা হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">ডাক্তার লগইন</h1>
            <p className="text-gray-500 mt-2">ইজি ডক্টর রংপুর - ডাক্তার প্যানেল</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                অ্যাক্সেস কোড
              </label>
              <input
                type="text"
                maxLength={6}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="৬ অক্ষরের কোড দিন"
                className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                এডমিন কর্তৃক প্রদত্ত ৬ অক্ষরের কোড প্রবেশ করুন
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || accessCode.length !== 6}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-teal-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  যাচাই করা হচ্ছে...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  লগইন করুন
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              কোড পাননি?{' '}
              <a href="/contact" className="text-teal-600 hover:text-teal-700 font-medium">
                এডমিনের সাথে যোগাযোগ করুন
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          © ২০২৫ ইজি ডক্টর রংপুর। সর্বস্বত্ব সংরক্ষিত।
        </p>
      </div>
    </div>
  )
}

export default DoctorLogin
