import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'

function Advertise() {
  const [formData, setFormData] = useState({
    applicant_type: '',
    name: '',
    email: '',
    phone: '',
    business_name: '',
    designation: '',
    ad_type: '',
    subject: '',
    message: ''
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const applicantTypes = [
    { value: 'doctor', label: 'ডাক্তার' },
    { value: 'hospital', label: 'হাসপাতাল' },
    { value: 'diagnostic_center', label: 'ডায়াগনস্টিক সেন্টার' },
    { value: 'pharmacy', label: 'ফার্মেসি' },
    { value: 'other', label: 'অন্যান্য' }
  ]

  const adTypes = [
    { value: 'home_banner', label: 'হোম পেজ প্রোমোশনাল ব্যানার', description: 'হোম পেজে বড় ব্যানার বিজ্ঞাপন' },
    { value: 'profile_promotion', label: 'প্রোফাইল প্রোমোশন', description: 'আপনার প্রোফাইল ফিচার্ড হিসেবে দেখান' },
    { value: 'featured_listing', label: 'ফিচার্ড লিস্টিং', description: 'সার্চ রেজাল্টে শীর্ষে থাকুন' },
    { value: 'special_offer', label: 'স্পেশাল অফার প্রোমোশন', description: 'বিশেষ ছাড় বা অফার প্রচার' },
    { value: 'new_chamber', label: 'নতুন চেম্বার/শাখা ঘোষণা', description: 'নতুন চেম্বার বা শাখার প্রচার' },
    { value: 'event', label: 'ইভেন্ট/ক্যাম্পেইন প্রচার', description: 'হেলথ ক্যাম্প বা ইভেন্ট প্রচার' }
  ]

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!formData.name || !formData.phone || !formData.applicant_type || !formData.ad_type || !formData.message) {
      setError('নাম, ফোন, আবেদনকারীর ধরণ, বিজ্ঞাপনের ধরণ এবং বার্তা অবশ্যই দিতে হবে')
      return
    }

    setSending(true)
    setError('')

    try {
      if (supabase && isConfigured) {
        const { error: insertError } = await supabase
          .from('advertisement_applications')
          .insert([{
            ...formData,
            status: 'pending'
          }])

        if (insertError) throw insertError
      }

      setSent(true)
      setFormData({
        applicant_type: '',
        name: '',
        email: '',
        phone: '',
        business_name: '',
        designation: '',
        ad_type: '',
        subject: '',
        message: ''
      })
      
      setTimeout(() => setSent(false), 8000)
    } catch (err) {
      console.error('Error:', err)
      setError('বার্তা পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    } finally {
      setSending(false)
    }
  }

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      title: 'বেশি দৃশ্যমানতা',
      description: 'প্রতিদিন হাজার হাজার রোগী আমাদের ওয়েবসাইট ভিজিট করেন। আপনার প্রোফাইল বা হাসপাতাল সবার সামনে আসবে।'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      title: 'বেশি রোগী পান',
      description: 'ফিচার্ড প্রোফাইল হিসেবে থাকলে আপনার কাছে বেশি রোগী আসবে এবং অ্যাপয়েন্টমেন্ট বাড়বে।'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      title: 'বিশ্বস্ততা বৃদ্ধি',
      description: 'প্রোমোটেড প্রোফাইলে ভেরিফাইড ব্যাজ থাকে যা রোগীদের আস্থা বাড়ায়।'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'সাশ্রয়ী মূল্য',
      description: 'আপনার বাজেট অনুযায়ী প্যাকেজ বেছে নিন। ছোট বিনিয়োগে বড় ফলাফল পান।'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'ডিজিটাল উপস্থিতি',
      description: 'আজকের যুগে ডিজিটাল উপস্থিতি অত্যন্ত জরুরি। অনলাইনে আপনার ব্র্যান্ড তৈরি করুন।'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
      title: 'পারফরম্যান্স রিপোর্ট',
      description: 'আপনার বিজ্ঞাপন কতজন দেখেছে, কত ক্লিক হয়েছে - সব তথ্য পাবেন।'
    }
  ]

  const bannerThemes = [
    {
      name: 'অভিনন্দন থিম',
      color: 'from-green-500 to-emerald-600',
      description: 'কোনো বিশেষ অর্জন বা সাফল্যের ঘোষণার জন্য',
      icon: '🎉'
    },
    {
      name: 'শোক থিম',
      color: 'from-gray-600 to-gray-700',
      description: 'শোক সংবাদ বা স্মরণ বার্তার জন্য',
      icon: '🕯️'
    },
    {
      name: 'নতুন চেম্বার থিম',
      color: 'from-blue-500 to-indigo-600',
      description: 'নতুন চেম্বার বা শাখা উদ্বোধনের ঘোষণার জন্য',
      icon: '🏥'
    },
    {
      name: 'প্রোফাইল প্রোমোশন থিম',
      color: 'from-purple-500 to-pink-600',
      description: 'ডাক্তার বা হাসপাতালের প্রোফাইল প্রোমোট করার জন্য',
      icon: '⭐'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
      <section className="relative bg-gradient-to-br from-fuchsia-900 via-purple-900 to-violet-950 text-white pt-28 pb-40 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.04%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-pink-500/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-violet-500/20 to-transparent"></div>
          <div className="absolute -top-20 right-1/4 w-72 h-72 bg-gradient-to-br from-yellow-400/30 to-orange-500/20 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-gradient-to-tr from-fuchsia-500/20 to-pink-500/20 rounded-full blur-[100px]"></div>
          <div className="absolute top-1/2 right-10 w-64 h-64 bg-gradient-to-bl from-purple-400/20 to-indigo-500/20 rounded-full blur-[60px] animate-pulse"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="text-center lg:text-left lg:max-w-2xl">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 backdrop-blur-md px-6 py-3 rounded-2xl mb-8 border border-yellow-400/30 shadow-lg shadow-yellow-500/10">
                <div className="flex -space-x-1">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-yellow-300">প্রিমিয়াম প্রোমোশন সুবিধা</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-tight">
                <span className="bg-gradient-to-r from-white via-pink-100 to-purple-200 bg-clip-text text-transparent">বিজ্ঞাপন দিন</span>
              </h1>
              <p className="text-xl md:text-2xl text-purple-100/90 max-w-xl leading-relaxed mb-10">
                ইজি ডক্টর রংপুর প্ল্যাটফর্মে আপনার ডাক্তার প্রোফাইল বা হাসপাতাল/ডায়াগনস্টিক সেন্টার প্রোমোট করুন।
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <a href="#contact-form" className="group bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-pink-600 hover:to-purple-700 transition-all shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-1 flex items-center gap-2">
                  <span>এখনই আবেদন করুন</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                <a href="#services" className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all border border-white/20 hover:border-white/40">
                  সেবাসমূহ দেখুন
                </a>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="w-72 h-72 bg-gradient-to-br from-purple-400/20 to-pink-500/20 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="w-full h-full bg-gradient-to-br from-fuchsia-500/30 to-violet-600/30 rounded-2xl flex flex-col items-center justify-center p-6">
                    <div className="text-6xl mb-4">📢</div>
                    <div className="text-center">
                      <p className="text-white/90 font-bold text-lg">আপনার সেবা</p>
                      <p className="text-white/70 text-sm">সবার কাছে পৌঁছে দিন</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/40 -rotate-12">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/40 rotate-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-20">
            <path d="M0 120L48 108C96 96 192 72 288 60C384 48 480 48 576 54C672 60 768 72 864 78C960 84 1056 84 1152 78C1248 72 1344 60 1392 54L1440 48V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="#faf5ff"/>
          </svg>
        </div>
      </section>

      <section id="services" className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-purple-600 font-semibold text-sm uppercase tracking-wider">কেন প্রোমোট করবেন?</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-4">প্রোমোশনের সুবিধাসমূহ</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              ইজি ডক্টর রংপুর প্ল্যাটফর্মে বিজ্ঞাপন দিয়ে আপনার সেবা আরও বেশি মানুষের কাছে পৌঁছে দিন
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-100 hover:border-purple-200 group">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform shadow-lg shadow-purple-200">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-purple-600 font-semibold text-sm uppercase tracking-wider">ব্যানার থিম</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-4">হোম পেজ প্রোমোশনাল ব্যানার</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              হোম পেজে আকর্ষণীয় ব্যানার দিয়ে আপনার বার্তা সবার সামনে তুলে ধরুন। ৪টি থিম থেকে আপনার পছন্দের থিম বেছে নিন।
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bannerThemes.map((theme, index) => (
              <div key={index} className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group">
                <div className={`h-48 bg-gradient-to-br ${theme.color} p-6 flex flex-col justify-between`}>
                  <span className="text-4xl">{theme.icon}</span>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">{theme.name}</h3>
                    <p className="text-white/80 text-sm">{theme.description}</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">প্রোমোশনাল ব্যানারে কী থাকবে?</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">আকর্ষণীয় ইমেজ</span>
                      <p className="text-gray-600 text-sm">আপনার ফটো বা হাসপাতালের ছবি সুন্দরভাবে প্রদর্শিত হবে</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">কাস্টম শিরোনাম ও বার্তা</span>
                      <p className="text-gray-600 text-sm">আপনার পছন্দমতো টেক্সট ও বার্তা যুক্ত করুন</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">"বিস্তারিত জানুন" বাটন</span>
                      <p className="text-gray-600 text-sm">ক্লিক করলে আপনার বিস্তারিত প্রোফাইল বা পেজে যাবে</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">সময়সীমা নির্ধারণ</span>
                      <p className="text-gray-600 text-sm">শুরু ও শেষ তারিখ নির্ধারণ করে রাখতে পারবেন</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-200">
                <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 rounded-xl text-white">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMSIvPjxjaXJjbGUgY3g9IjAiIGN5PSIwIiByPSIxIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4wNSIvPjxjaXJjbGUgY3g9IjQwIiBjeT0iNDAiIHI9IjEiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-60"></div>
                  <div className="absolute top-2 left-2 text-3xl opacity-20">🎊</div>
                  <div className="absolute top-2 right-2 text-2xl opacity-20">✨</div>
                  <div className="absolute bottom-2 left-4 text-2xl opacity-20">🎉</div>
                  <div className="absolute bottom-2 right-2 text-3xl opacity-20">🌟</div>
                  
                  <div className="relative p-6">
                    <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-800 px-3 py-1 rounded-full mb-3 text-xs font-medium">
                      <span>অভিনন্দন</span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 overflow-hidden flex-shrink-0">
                        <span className="text-3xl">👨‍⚕️</span>
                      </div>
                      <div className="text-left">
                        <h4 className="text-lg font-bold mb-0.5">ডা. মোহাম্মদ আলী</h4>
                        <p className="text-white/80 text-xs">হৃদরোগ বিশেষজ্ঞ | এমবিবিএস, এফসিপিএস</p>
                      </div>
                    </div>
                    
                    <p className="text-white/90 text-sm mb-4">সহকারী অধ্যাপক পদে পদোন্নতি পাওয়ায় অভিনন্দন!</p>
                    
                    <button className="bg-white text-pink-700 px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2">
                      বিস্তারিত জানুন
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-center text-gray-500 text-sm mt-4">অভিনন্দন থিম ব্যানার প্রিভিউ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-purple-600 font-semibold text-sm uppercase tracking-wider">অতিরিক্ত সুবিধা</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-4">প্রোফাইল প্রোমোশন সুবিধা</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6 text-yellow-600">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">ফিচার্ড ব্যাজ</h3>
              <p className="text-gray-600">আপনার প্রোফাইলে বিশেষ "ফিচার্ড" ব্যাজ যুক্ত হবে যা রোগীদের দৃষ্টি আকর্ষণ করবে।</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-green-600">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">সার্চে শীর্ষে</h3>
              <p className="text-gray-600">রোগীরা যখন ডাক্তার বা হাসপাতাল সার্চ করবে, আপনি সবার আগে দেখা যাবেন।</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">হোম স্লাইডারে</h3>
              <p className="text-gray-600">হোম পেজের "ট্রেন্ডিং ডাক্তার" স্লাইডারে আপনার প্রোফাইল দেখানো হবে।</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 text-purple-600">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">স্পেশাল নোটিফিকেশন</h3>
              <p className="text-gray-600">নতুন অফার বা চেম্বার সম্পর্কে ভিজিটরদের কাছে বিশেষ নোটিফিকেশন পৌঁছাবে।</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-6 text-red-600">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">বিশ্বস্ত চিহ্ন</h3>
              <p className="text-gray-600">প্রোমোটেড প্রোফাইলে "বিশ্বস্ত" চিহ্ন থাকবে যা রোগীদের আস্থা বাড়াবে।</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 text-orange-600">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">ফ্লেক্সিবল সময়কাল</h3>
              <p className="text-gray-600">১ সপ্তাহ থেকে ১ বছর পর্যন্ত আপনার সুবিধামতো সময়কাল বেছে নিন।</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact-form" className="py-20 bg-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-purple-600 font-semibold text-sm uppercase tracking-wider">যোগাযোগ করুন</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-4">বিজ্ঞাপনের জন্য আবেদন করুন</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              নিচের ফর্মটি পূরণ করুন। আমাদের টিম আপনার সাথে যোগাযোগ করবে এবং আপনার প্রয়োজন অনুযায়ী সেরা প্যাকেজ সাজেস্ট করবে।
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-purple-100">
            {sent && (
              <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-green-800 font-semibold text-lg">আবেদন সফলভাবে পাঠানো হয়েছে!</h3>
                    <p className="text-green-600">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">আবেদনকারীর ধরণ *</label>
                  <select
                    value={formData.applicant_type}
                    onChange={(e) => setFormData({ ...formData, applicant_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">বাছাই করুন</option>
                    {applicantTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">বিজ্ঞাপনের ধরণ *</label>
                  <select
                    value={formData.ad_type}
                    onChange={(e) => setFormData({ ...formData, ad_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">বাছাই করুন</option>
                    {adTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">আপনার নাম *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="আপনার পূর্ণ নাম"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ইমেইল</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.applicant_type === 'doctor' ? 'বিশেষত্ব/ডিগ্রি' : 'হাসপাতাল/প্রতিষ্ঠানের নাম'}
                  </label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder={formData.applicant_type === 'doctor' ? 'যেমন: এমবিবিএস, এফসিপিএস (মেডিসিন)' : 'প্রতিষ্ঠানের নাম লিখুন'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">বিষয়</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="বিজ্ঞাপনের বিষয় লিখুন"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">আপনার বার্তা *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  placeholder="আপনি কী ধরনের বিজ্ঞাপন চান, কোন তথ্য দিতে চান - বিস্তারিত লিখুন..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                {sending ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    পাঠানো হচ্ছে...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    আবেদন পাঠান
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-purple-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">এখনই শুরু করুন!</h2>
          <p className="text-purple-100 text-lg mb-8">
            আপনার সেবা আরও বেশি মানুষের কাছে পৌঁছে দিন। ইজি ডক্টর রংপুরে বিজ্ঞাপন দিয়ে আপনার ব্যবসা বাড়ান।
          </p>
          <a href="#contact-form" className="inline-flex items-center gap-2 bg-white text-purple-700 px-8 py-4 rounded-full font-semibold hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl">
            এখনই আবেদন করুন
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  )
}

export default Advertise
