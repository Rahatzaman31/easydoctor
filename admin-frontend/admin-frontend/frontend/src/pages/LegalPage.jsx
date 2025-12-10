import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'
import Footer from '../components/Footer'

const defaultContent = {
  'editorial-policy': {
    title: 'সম্পাদকীয় নীতি',
    content: `<h2>ইজি ডক্টর রংপুর সম্পাদকীয় নীতি</h2>
    <p>ইজি ডক্টর রংপুর একটি নির্ভরযোগ্য স্বাস্থ্যসেবা প্ল্যাটফর্ম যা রংপুর বিভাগের মানুষদের সঠিক এবং যাচাইকৃত স্বাস্থ্য তথ্য প্রদান করতে প্রতিশ্রুতিবদ্ধ।</p>
    <h3>আমাদের মূলনীতি</h3>
    <ul>
      <li><strong>সঠিকতা:</strong> আমরা সকল তথ্য যাচাই করে প্রকাশ করি এবং নিয়মিত আপডেট রাখি।</li>
      <li><strong>নিরপেক্ষতা:</strong> আমরা কোনো বিশেষ ডাক্তার বা প্রতিষ্ঠানকে অগ্রাধিকার দিই না।</li>
      <li><strong>স্বচ্ছতা:</strong> আমাদের তথ্যের উৎস সম্পর্কে স্পষ্ট থাকি।</li>
      <li><strong>দায়িত্বশীলতা:</strong> স্বাস্থ্য সংক্রান্ত তথ্য প্রকাশে সর্বোচ্চ সতর্কতা অবলম্বন করি।</li>
    </ul>`,
    icon: 'document'
  },
  'advertisement-policy': {
    title: 'বিজ্ঞাপন নীতি',
    content: `<h2>ইজি ডক্টর রংপুর বিজ্ঞাপন নীতি</h2>
    <p>ইজি ডক্টর রংপুর প্ল্যাটফর্মে বিজ্ঞাপন প্রকাশের ক্ষেত্রে আমরা কঠোর নীতিমালা অনুসরণ করি যা আমাদের ব্যবহারকারীদের স্বার্থ রক্ষা করে।</p>`,
    icon: 'megaphone'
  },
  'correction-policy': {
    title: 'সংশোধন নীতি',
    content: `<h2>ইজি ডক্টর রংপুর সংশোধন নীতি</h2>
    <p>ইজি ডক্টর রংপুর সঠিক তথ্য প্রদানে প্রতিশ্রুতিবদ্ধ। তবে কখনো কখনো ভুল হতে পারে এবং সেই ভুল সংশোধনে আমরা সর্বদা তৎপর।</p>`,
    icon: 'edit'
  },
  'terms-of-use': {
    title: 'ব্যবহারের শর্তাবলী',
    content: `<h2>ইজি ডক্টর রংপুর ব্যবহারের শর্তাবলী</h2>
    <p>ইজি ডক্টর রংপুর প্ল্যাটফর্ম ব্যবহার করার আগে অনুগ্রহ করে নিম্নলিখিত শর্তাবলী মনোযোগ সহকারে পড়ুন।</p>`,
    icon: 'clipboard'
  },
  'doctors-terms': {
    title: 'ডক্টর্স টার্মস এ্যান্ড কন্ডিশন',
    content: `<h2>ইজি ডক্টর রংপুর - ডাক্তারদের জন্য শর্তাবলী</h2>
    <p>ইজি ডক্টর রংপুর প্ল্যাটফর্মে ডাক্তার হিসেবে তালিকাভুক্ত হতে এবং সেবা প্রদান করতে নিম্নলিখিত শর্তাবলী প্রযোজ্য।</p>`,
    icon: 'shield'
  },
  'privacy-policy': {
    title: 'গোপনীয়তা নীতি',
    content: `<h2>ইজি ডক্টর রংপুর গোপনীয়তা নীতি</h2>
    <p>ইজি ডক্টর রংপুর আপনার গোপনীয়তা রক্ষায় প্রতিশ্রুতিবদ্ধ। এই গোপনীয়তা নীতিতে আমরা কীভাবে আপনার ব্যক্তিগত তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত রাখি তা বর্ণনা করা হয়েছে।</p>
    <h3>তথ্য সংগ্রহ</h3>
    <p>আমরা নিম্নলিখিত তথ্য সংগ্রহ করতে পারি:</p>
    <ul>
      <li><strong>ব্যক্তিগত তথ্য:</strong> নাম, ফোন নম্বর, ইমেইল ঠিকানা।</li>
      <li><strong>স্বাস্থ্য সংক্রান্ত তথ্য:</strong> অ্যাপয়েন্টমেন্ট বুকিংয়ের জন্য প্রয়োজনীয় তথ্য।</li>
      <li><strong>ডিভাইস তথ্য:</strong> ব্রাউজার টাইপ, IP ঠিকানা।</li>
    </ul>
    <h3>তথ্য ব্যবহার</h3>
    <p>আমরা আপনার তথ্য নিম্নলিখিত উদ্দেশ্যে ব্যবহার করি:</p>
    <ul>
      <li>অ্যাপয়েন্টমেন্ট বুকিং এবং নিশ্চিতকরণ।</li>
      <li>সেবা উন্নয়ন এবং ব্যবহারকারী অভিজ্ঞতা বৃদ্ধি।</li>
      <li>জরুরি যোগাযোগ এবং বিজ্ঞপ্তি প্রেরণ।</li>
    </ul>
    <h3>তথ্য সুরক্ষা</h3>
    <p>আমরা আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখতে শিল্প-মান নিরাপত্তা ব্যবস্থা ব্যবহার করি। তবে, ইন্টারনেটের মাধ্যমে তথ্য প্রেরণ সম্পূর্ণ নিরাপদ নয়।</p>
    <h3>তৃতীয় পক্ষের সাথে শেয়ারিং</h3>
    <p>আমরা আপনার সম্মতি ছাড়া তৃতীয় পক্ষের সাথে আপনার ব্যক্তিগত তথ্য শেয়ার করি না, তবে আইনি বাধ্যবাধকতা থাকলে ব্যতিক্রম।</p>
    <h3>কুকিজ</h3>
    <p>আমরা আপনার অভিজ্ঞতা উন্নত করতে কুকিজ ব্যবহার করি। কুকিজ হলো ছোট ডাটা ফাইল যা আপনার ব্রাউজারে সংরক্ষিত হয়। আপনি ব্রাউজার সেটিংস থেকে কুকিজ নিয়ন্ত্রণ বা বন্ধ করতে পারেন।</p>
    <h3>আপনার অধিকার</h3>
    <p>আপনি যেকোনো সময়:</p>
    <ul>
      <li>আপনার তথ্য দেখতে বা সংশোধন করতে পারেন।</li>
      <li>তথ্য মুছে ফেলার অনুরোধ করতে পারেন।</li>
      <li>বিপণন যোগাযোগ থেকে বের হতে পারেন।</li>
      <li>আপনার তথ্যের কপি চাইতে পারেন।</li>
    </ul>
    <h3>যোগাযোগ</h3>
    <p>গোপনীয়তা সংক্রান্ত কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।</p>`,
    icon: 'lock'
  },
  'terms-conditions': {
    title: 'শর্তাবলী',
    content: `<h2>ইজি ডক্টর রংপুর শর্তাবলী</h2>
    <p>ইজি ডক্টর রংপুর ওয়েবসাইট এবং সেবা ব্যবহার করার আগে এই শর্তাবলী মনোযোগ সহকারে পড়ুন।</p>
    <h3>সেবার বিবরণ</h3>
    <p>ইজি ডক্টর রংপুর একটি অনলাইন প্ল্যাটফর্ম যা রংপুর বিভাগে ডাক্তার খোঁজা, অ্যাপয়েন্টমেন্ট বুকিং এবং স্বাস্থ্যসেবা সংক্রান্ত তথ্য প্রদান করে।</p>
    <h3>ব্যবহারকারীর দায়িত্ব</h3>
    <ul>
      <li>সঠিক এবং সত্য তথ্য প্রদান করতে হবে।</li>
      <li>অন্যের পরিচয় ব্যবহার করা যাবে না।</li>
      <li>প্ল্যাটফর্মের অপব্যবহার করা যাবে না।</li>
      <li>অ্যাপয়েন্টমেন্টে সময়মতো উপস্থিত হতে হবে।</li>
    </ul>
    <h3>অ্যাপয়েন্টমেন্ট নীতি</h3>
    <ul>
      <li>অ্যাপয়েন্টমেন্ট বাতিল বা পরিবর্তনের জন্য যথাসময়ে জানাতে হবে।</li>
      <li>পেইড সিরিয়ালের ক্ষেত্রে রিফান্ড নীতি প্রযোজ্য।</li>
      <li>ডাক্তারের সিদ্ধান্ত চূড়ান্ত।</li>
    </ul>
    <h3>পেমেন্ট শর্তাবলী</h3>
    <ul>
      <li>পেইড সিরিয়ালে অগ্রিম পেমেন্ট প্রয়োজন।</li>
      <li>পেমেন্ট বিকাশের মাধ্যমে সম্পন্ন হয়।</li>
      <li>সফল পেমেন্টের পর বুকিং নিশ্চিত হয়।</li>
      <li>রিফান্ড নীতি নির্দিষ্ট শর্ত সাপেক্ষে প্রযোজ্য।</li>
    </ul>
    <h3>দায়বদ্ধতা সীমাবদ্ধতা</h3>
    <p>ইজি ডক্টর রংপুর শুধুমাত্র একটি মধ্যস্থতাকারী প্ল্যাটফর্ম। চিকিৎসা সংক্রান্ত কোনো পরামর্শ বা ফলাফলের জন্য আমরা দায়ী নই।</p>
    <h3>পরিবর্তন</h3>
    <p>আমরা যেকোনো সময় এই শর্তাবলী পরিবর্তন করার অধিকার রাখি। পরিবর্তন হলে ওয়েবসাইটে প্রকাশ করা হবে।</p>`,
    icon: 'document'
  }
}

const iconMap = {
  document: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  megaphone: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  edit: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  clipboard: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  shield: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  lock: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function LegalPage() {
  const location = useLocation()
  const slug = location.pathname.replace('/', '')
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [relatedPages, setRelatedPages] = useState([])

  useEffect(() => {
    fetchPageData()
    fetchRelatedPages()
  }, [slug, location.pathname])

  async function fetchPageData() {
    setLoading(true)
    try {
      if (supabase && isConfigured) {
        const { data, error } = await supabase
          .from('legal_pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single()

        if (!error && data) {
          setPageData(data)
          setLoading(false)
          return
        }
      }
      
      if (defaultContent[slug]) {
        setPageData({
          title_bn: defaultContent[slug].title,
          content: defaultContent[slug].content,
          icon_type: defaultContent[slug].icon,
          last_updated: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error fetching page:', error)
      if (defaultContent[slug]) {
        setPageData({
          title_bn: defaultContent[slug].title,
          content: defaultContent[slug].content,
          icon_type: defaultContent[slug].icon,
          last_updated: new Date().toISOString()
        })
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchRelatedPages() {
    try {
      if (supabase && isConfigured) {
        const { data, error } = await supabase
          .from('legal_pages')
          .select('slug, title_bn, icon_type')
          .eq('is_active', true)
          .neq('slug', slug)
          .order('display_order', { ascending: true })

        if (!error && data) {
          setRelatedPages(data)
          return
        }
      }
      
      const defaultRelated = Object.entries(defaultContent)
        .filter(([key]) => key !== slug)
        .map(([key, value]) => ({
          slug: key,
          title_bn: value.title,
          icon_type: value.icon
        }))
      setRelatedPages(defaultRelated)
    } catch (error) {
      console.error('Error fetching related pages:', error)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </div>
    )
  }

  if (!pageData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">পেজ পাওয়া যায়নি</h1>
          <p className="text-gray-600 mb-8">দুঃখিত, আপনি যে পেজটি খুঁজছেন সেটি পাওয়া যায়নি।</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            হোম পেজে ফিরে যান
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-400/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-20">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors group"
          >
            <span className="w-8 h-8 bg-white/20 group-hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            <span className="text-sm font-medium">হোম পেজে ফিরে যান</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white">
              {iconMap[pageData.icon_type] || iconMap.document}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {pageData.title_bn}
              </h1>
              <p className="text-teal-100 text-sm">
                সর্বশেষ আপডেট: {formatDate(pageData.last_updated)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10">
              <div 
                className="prose prose-lg max-w-none
                  prose-headings:text-gray-800 prose-headings:font-bold
                  prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100
                  prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-teal-700
                  prose-h4:text-lg prose-h4:mt-4 prose-h4:mb-2
                  prose-p:text-gray-600 prose-p:leading-relaxed prose-p:my-4
                  prose-ul:my-4 prose-ul:space-y-2
                  prose-ol:my-4 prose-ol:space-y-2
                  prose-li:text-gray-600 prose-li:leading-relaxed
                  prose-strong:text-gray-800 prose-strong:font-semibold
                  prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: pageData.content }}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"></span>
                অন্যান্য আইনগত তথ্য
              </h3>
              <ul className="space-y-3">
                {relatedPages.map((page) => (
                  <li key={page.slug}>
                    <Link
                      to={`/${page.slug}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-teal-50 transition-all group"
                    >
                      <span className="w-10 h-10 bg-teal-100 group-hover:bg-teal-200 rounded-lg flex items-center justify-center text-teal-600 transition-colors">
                        <span className="w-5 h-5">
                          {iconMap[page.icon_type] || iconMap.document}
                        </span>
                      </span>
                      <span className="text-gray-700 group-hover:text-teal-700 font-medium text-sm transition-colors">
                        {page.title_bn}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">সাহায্য প্রয়োজন?</h4>
                <Link
                  to="/contact"
                  className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  আমাদের সাথে যোগাযোগ করুন
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default LegalPage
