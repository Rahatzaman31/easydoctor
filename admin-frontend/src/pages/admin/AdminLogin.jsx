import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function AdminLogin() {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [currentCredentials, setCurrentCredentials] = useState({ username: '', password: '' })
  const [newCredentials, setNewCredentials] = useState({ username: '', password: '', confirmPassword: '' })
  const [otp, setOtp] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('adminLoggedIn', 'true')
        sessionStorage.setItem('adminAuth', JSON.stringify({
          username: credentials.username,
          password: credentials.password
        }))
        navigate('/admin')
      } else {
        setError(data.message || 'ভুল ইউজারনেম বা পাসওয়ার্ড')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('লগইন করতে সমস্যা হয়েছে')
    }
    setLoading(false)
  }

  async function handleGenerateOtp(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!currentCredentials.username || !currentCredentials.password) {
      setError('বর্তমান ইউজারনেম এবং পাসওয়ার্ড দিন')
      setLoading(false)
      return
    }

    if (!newCredentials.username || !newCredentials.password) {
      setError('নতুন ইউজারনেম এবং পাসওয়ার্ড দিন')
      setLoading(false)
      return
    }

    if (newCredentials.password !== newCredentials.confirmPassword) {
      setError('নতুন পাসওয়ার্ড মিলছে না')
      setLoading(false)
      return
    }

    if (newCredentials.password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername: currentCredentials.username,
          currentPassword: currentCredentials.password,
          newUsername: newCredentials.username,
          newPassword: newCredentials.password
        })
      })

      const data = await response.json()

      if (data.success) {
        setShowOtpForm(true)
        setSuccess(data.message)
      } else {
        setError(data.message || 'OTP তৈরি করতে সমস্যা হয়েছে')
      }
    } catch (err) {
      console.error('OTP generation error:', err)
      setError('OTP তৈরি করতে সমস্যা হয়েছে')
    }
    setLoading(false)
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!otp || otp.length !== 6) {
      setError('৬ সংখ্যার OTP দিন')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('ক্রেডেনশিয়াল সফলভাবে আপডেট হয়েছে! নতুন ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করুন।')
        setShowUpdateForm(false)
        setShowOtpForm(false)
        setCurrentCredentials({ username: '', password: '' })
        setNewCredentials({ username: '', password: '', confirmPassword: '' })
        setOtp('')
      } else {
        setError(data.message || 'OTP যাচাই করতে সমস্যা হয়েছে')
      }
    } catch (err) {
      console.error('OTP verification error:', err)
      setError('OTP যাচাই করতে সমস্যা হয়েছে')
    }
    setLoading(false)
  }

  function resetForms() {
    setShowUpdateForm(false)
    setShowOtpForm(false)
    setCurrentCredentials({ username: '', password: '' })
    setNewCredentials({ username: '', password: '', confirmPassword: '' })
    setOtp('')
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-icon.png" alt="ইজি ডক্টর রংপুর" className="w-16 h-16 rounded-full object-cover mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">এডমিন প্যানেল</h1>
          <p className="text-gray-500 mt-2">ইজি ডক্টর রংপুর</p>
        </div>

        {!showUpdateForm && !showOtpForm && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-center text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-lg text-center text-sm">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ইউজারনেম</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="ইউজারনেম দিন"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">পাসওয়ার্ড</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="পাসওয়ার্ড দিন"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? 'প্রবেশ করা হচ্ছে...' : 'প্রবেশ করুন'}
            </button>
          </form>
        )}

        {showUpdateForm && !showOtpForm && (
          <form onSubmit={handleGenerateOtp} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">ক্রেডেনশিয়াল পরিবর্তন করুন</h2>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-center text-sm">
                {error}
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <p className="text-sm font-medium text-gray-700">বর্তমান ক্রেডেনশিয়াল</p>
              <div>
                <label className="block text-xs text-gray-600 mb-1">বর্তমান ইউজারনেম</label>
                <input
                  type="text"
                  required
                  className="input-field text-sm"
                  placeholder="বর্তমান ইউজারনেম"
                  value={currentCredentials.username}
                  onChange={(e) => setCurrentCredentials({ ...currentCredentials, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">বর্তমান পাসওয়ার্ড</label>
                <input
                  type="password"
                  required
                  className="input-field text-sm"
                  placeholder="বর্তমান পাসওয়ার্ড"
                  value={currentCredentials.password}
                  onChange={(e) => setCurrentCredentials({ ...currentCredentials, password: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <p className="text-sm font-medium text-blue-700">নতুন ক্রেডেনশিয়াল</p>
              <div>
                <label className="block text-xs text-gray-600 mb-1">নতুন ইউজারনেম</label>
                <input
                  type="text"
                  required
                  className="input-field text-sm"
                  placeholder="নতুন ইউজারনেম দিন"
                  value={newCredentials.username}
                  onChange={(e) => setNewCredentials({ ...newCredentials, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">নতুন পাসওয়ার্ড</label>
                <input
                  type="password"
                  required
                  className="input-field text-sm"
                  placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
                  value={newCredentials.password}
                  onChange={(e) => setNewCredentials({ ...newCredentials, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">পাসওয়ার্ড নিশ্চিত করুন</label>
                <input
                  type="password"
                  required
                  className="input-field text-sm"
                  placeholder="পাসওয়ার্ড আবার দিন"
                  value={newCredentials.confirmPassword}
                  onChange={(e) => setNewCredentials({ ...newCredentials, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? 'OTP তৈরি হচ্ছে...' : 'OTP তৈরি করুন'}
            </button>

            <button
              type="button"
              onClick={resetForms}
              className="w-full py-2 text-gray-600 hover:text-gray-800"
            >
              বাতিল করুন
            </button>
          </form>
        )}

        {showOtpForm && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">OTP যাচাই করুন</h2>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-center text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-lg text-center text-sm">
                {success}
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
              <p className="font-medium mb-2">OTP তৈরি হয়েছে!</p>
              <p>সুপাবেস ড্যাশবোর্ডে যান এবং <strong>admin_otp</strong> টেবিল থেকে <strong>otp_code</strong> কপি করুন।</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">OTP কোড</label>
              <input
                type="text"
                required
                maxLength={6}
                className="input-field text-center text-2xl tracking-widest"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? 'যাচাই হচ্ছে...' : 'যাচাই করুন ও সেভ করুন'}
            </button>

            <button
              type="button"
              onClick={resetForms}
              className="w-full py-2 text-gray-600 hover:text-gray-800"
            >
              বাতিল করুন
            </button>
          </form>
        )}

        {!showUpdateForm && !showOtpForm && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowUpdateForm(true)}
              className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              ইউজারনেম / পাসওয়ার্ড পরিবর্তন করুন
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminLogin
