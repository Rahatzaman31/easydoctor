import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'

const Footer = () => {
  const [socialLinks, setSocialLinks] = useState({
    facebook_url: '',
    twitter_url: '',
    linkedin_url: '',
    youtube_url: '',
    instagram_url: ''
  })

  useEffect(() => {
    fetchSocialLinks()
  }, [])

  async function fetchSocialLinks() {
    if (!supabase || !isConfigured) return

    try {
      const { data, error } = await supabase
        .from('contact_settings')
        .select('facebook_url, twitter_url, linkedin_url, youtube_url, instagram_url')
        .limit(1)
        .single()

      if (!error && data) {
        setSocialLinks(data)
      }
    } catch (err) {
      console.log('Using default social links')
    }
  }

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-10 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="sm:col-span-2 lg:col-span-4">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo-footer.png" alt="ইজি ডক্টর রংপুর" className="h-16 lg:h-20 object-contain" />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
                রংপুর বিভাগের ডাক্তার অ্যাপয়েন্টমেন্ট সেবা। সহজেই অনলাইনে অ্যাপয়েন্টমেন্ট নিন এবং আপনার স্বাস্থ্যসেবা নিশ্চিত করুন।
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {socialLinks.facebook_url && (
                  <a href={socialLinks.facebook_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 group" title="ফেসবুক">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.twitter_url && (
                  <a href={socialLinks.twitter_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 hover:bg-black rounded-lg flex items-center justify-center transition-all duration-300 group" title="টুইটার/এক্স">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.linkedin_url && (
                  <a href={socialLinks.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-all duration-300 group" title="লিংকডইন">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.youtube_url && (
                  <a href={socialLinks.youtube_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all duration-300 group" title="ইউটিউব">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.instagram_url && (
                  <a href={socialLinks.instagram_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 rounded-lg flex items-center justify-center transition-all duration-300 group" title="ইনস্টাগ্রাম">
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>

            <div className="sm:col-span-1 lg:col-span-4">
              <h4 className="text-base lg:text-lg font-semibold text-white mb-4 lg:mb-6 flex items-center gap-2">
                <span className="w-6 lg:w-8 h-0.5 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"></span>
                স্বাস্থ্যসেবা প্রদানকারীদের জন্য
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link to="/join-as-doctor" className="group flex items-center gap-3 text-slate-400 hover:text-teal-400 transition-all duration-300">
                    <span className="w-8 h-8 bg-slate-800 group-hover:bg-teal-500/20 rounded-lg flex items-center justify-center transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <span className="text-sm">ডাক্তার হিসেবে যোগ দিন</span>
                  </Link>
                </li>
                <li>
                  <Link to="/join-as-hospital" className="group flex items-center gap-3 text-slate-400 hover:text-teal-400 transition-all duration-300">
                    <span className="w-8 h-8 bg-slate-800 group-hover:bg-teal-500/20 rounded-lg flex items-center justify-center transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </span>
                    <span className="text-sm">হাসপাতাল ও ডায়াগনস্টিক সেন্টার যুক্ত করুন</span>
                  </Link>
                </li>
                <li>
                  <Link to="/register-ambulance" className="group flex items-center gap-3 text-slate-400 hover:text-teal-400 transition-all duration-300">
                    <span className="w-8 h-8 bg-slate-800 group-hover:bg-teal-500/20 rounded-lg flex items-center justify-center transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </span>
                    <span className="text-sm">অ্যাম্বুলেন্স তালিকাভুক্ত করুন</span>
                  </Link>
                </li>
                <li>
                  <Link to="/advertise" className="group flex items-center gap-3 text-slate-400 hover:text-teal-400 transition-all duration-300">
                    <span className="w-8 h-8 bg-slate-800 group-hover:bg-teal-500/20 rounded-lg flex items-center justify-center transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </span>
                    <span className="text-sm">বিজ্ঞাপন দিন</span>
                  </Link>
                </li>
                <li>
                  <Link to="/data-edit-request" className="group flex items-center gap-3 text-slate-400 hover:text-teal-400 transition-all duration-300">
                    <span className="w-8 h-8 bg-slate-800 group-hover:bg-teal-500/20 rounded-lg flex items-center justify-center transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </span>
                    <span className="text-sm">তথ্য সংশোধন করুন বা মুছে ফেলুন</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="sm:col-span-1 lg:col-span-4">
              <h4 className="text-base lg:text-lg font-semibold text-white mb-4 lg:mb-6 flex items-center gap-2">
                <span className="w-6 lg:w-8 h-0.5 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"></span>
                আইনগত তথ্য
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link to="/editorial-policy" className="group flex items-center gap-3 text-slate-400 hover:text-teal-400 transition-all duration-300">
                    <span className="w-8 h-8 bg-slate-800 group-hover:bg-teal-500/20 rounded-lg flex items-center justify-center transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    <span className="text-sm">সম্পাদকীয় নীতি</span>
                  </Link>
                </li>
                <li>
                  <Link to="/advertisement-policy" className="group flex items-center gap-3 text-slate-400 hover:text-teal-400 transition-all duration-300">
                    <span className="w-8 h-8 bg-slate-800 group-hover:bg-teal-500/20 rounded-lg flex items-center justify-center transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </span>
                    <span className="text-sm">বিজ্ঞাপন নীতি</span>
                  </Link>
                </li>
                <li>
                  <Link to="/correction-policy" className="group flex items-center gap-3 text-slate-400 hover:text-teal-400 transition-all duration-300">
                    <span className="w-8 h-8 bg-slate-800 group-hover:bg-teal-500/20 rounded-lg flex items-center justify-center transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </span>
                    <span className="text-sm">সংশোধন নীতি</span>
                  </Link>
                </li>
                <li>
                  <Link to="/terms-of-use" className="group flex items-center gap-3 text-slate-400 hover:text-teal-400 transition-all duration-300">
                    <span className="w-8 h-8 bg-slate-800 group-hover:bg-teal-500/20 rounded-lg flex items-center justify-center transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </span>
                    <span className="text-sm">ব্যবহারের শর্তাবলী</span>
                  </Link>
                </li>
                <li>
                  <Link to="/doctors-terms" className="group flex items-center gap-3 text-slate-400 hover:text-teal-400 transition-all duration-300">
                    <span className="w-8 h-8 bg-slate-800 group-hover:bg-teal-500/20 rounded-lg flex items-center justify-center transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </span>
                    <span className="text-sm">ডক্টর্স টার্মস এ্যান্ড কন্ডিশন</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-slate-500 text-sm mb-2">
                &copy; {new Date().getFullYear()} ইজি ডক্টর রংপুর। সর্বস্বত্ব সংরক্ষিত।
              </p>
              <p className="text-slate-600 text-xs">
                Icons made by <a href="https://www.freepik.com" className="hover:text-teal-400 transition-colors" target="_blank" rel="noopener noreferrer">Freepik</a> and other authors from <a href="https://www.flaticon.com" className="hover:text-teal-400 transition-colors" target="_blank" rel="noopener noreferrer">Flaticon</a>
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <Link to="/about-us" className="text-slate-500 hover:text-teal-400 text-sm transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                আমাদের সম্পর্কে
              </Link>
              <Link to="/privacy-policy" className="text-slate-500 hover:text-teal-400 text-sm transition-colors">
                গোপনীয়তা নীতি
              </Link>
              <Link to="/terms-conditions" className="text-slate-500 hover:text-teal-400 text-sm transition-colors">
                শর্তাবলী
              </Link>
              <Link to="/contact" className="text-slate-500 hover:text-teal-400 text-sm transition-colors">
                যোগাযোগ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer