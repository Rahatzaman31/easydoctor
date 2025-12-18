import { useState, useEffect, useRef, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '';

function InterstitialAd() {
  const [show, setShow] = useState(false)
  const [settings, setSettings] = useState(null)
  const [canClose, setCanClose] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  
  const showTimerRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const showAd = useCallback((data) => {
    if (!isMountedRef.current) return
    
    setShow(true)
    sessionStorage.setItem('interstitial_ad_shown', 'true')
    
    if (data.show_close_button) {
      const closeDelay = data.close_button_delay ?? 3
      if (closeDelay === 0) {
        setCanClose(true)
        setCountdown(0)
      } else {
        setCountdown(closeDelay)
        
        let remaining = closeDelay
        const scheduleCountdown = () => {
          if (!isMountedRef.current) return
          
          remaining--
          if (remaining <= 0) {
            setCanClose(true)
            setCountdown(0)
          } else {
            setCountdown(remaining)
            countdownIntervalRef.current = setTimeout(scheduleCountdown, 1000)
          }
        }
        
        countdownIntervalRef.current = setTimeout(scheduleCountdown, 1000)
      }
    } else {
      setCanClose(false)
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    
    async function fetchSettings() {
      try {
        const response = await fetch(`${API_URL}/api/interstitial-ads`)
        const result = await response.json()

        if (result.success && result.data && result.data.is_enabled && isMountedRef.current) {
          setSettings(result.data)
          
          const hasSeenAd = sessionStorage.getItem('interstitial_ad_shown')
          if (result.data.show_once_per_session && hasSeenAd) {
            return
          }

          const delayMs = (result.data.delay_seconds ?? 60) * 1000
          showTimerRef.current = setTimeout(() => {
            showAd(result.data)
          }, delayMs)
        }
      } catch (err) {
        console.log('No interstitial ad configured')
      }
    }
    
    fetchSettings()
    
    return () => {
      isMountedRef.current = false
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [showAd])

  function handleClose() {
    if (canClose) {
      setShow(false)
    }
  }

  function handleAdClick() {
    if (settings?.link_url) {
      window.open(settings.link_url, '_blank', 'noopener,noreferrer')
    }
  }

  if (!show || !settings) return null

  const imageUrl = isMobile ? settings.mobile_image_url : settings.desktop_image_url
  const fallbackUrl = isMobile ? settings.desktop_image_url : settings.mobile_image_url
  
  if (!imageUrl && !fallbackUrl) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 md:p-8">
        {settings.show_close_button && (
          <button
            onClick={handleClose}
            disabled={!canClose}
            className={`absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-300 ${
              canClose 
                ? 'bg-white text-gray-800 hover:bg-gray-100 cursor-pointer shadow-lg' 
                : 'bg-white/20 text-white cursor-not-allowed'
            }`}
          >
            {canClose ? (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <span className="text-lg sm:text-xl font-bold">{countdown}</span>
            )}
          </button>
        )}
        
        <div 
          onClick={handleAdClick}
          className={`relative flex items-center justify-center ${settings.link_url ? 'cursor-pointer' : ''}`}
          style={{ margin: '0 auto' }}
        >
          <picture className="flex items-center justify-center">
            <source media="(max-width: 767px)" srcSet={settings.mobile_image_url || settings.desktop_image_url} />
            <source media="(min-width: 768px)" srcSet={settings.desktop_image_url || settings.mobile_image_url} />
            <img
              src={imageUrl || fallbackUrl}
              alt="বিজ্ঞাপন"
              className="max-h-[85vh] sm:max-h-[90vh] w-auto h-auto object-contain rounded-lg sm:rounded-xl shadow-2xl mx-auto"
              style={{ 
                maxWidth: isMobile ? 'calc(100vw - 32px)' : '90vw',
              }}
            />
          </picture>
          
          {settings.link_url && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 sm:p-4 rounded-b-lg sm:rounded-b-xl">
              <p className="text-white text-xs sm:text-sm text-center flex items-center justify-center gap-1 sm:gap-2">
                <span>বিস্তারিত দেখতে ক্লিক করুন</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InterstitialAd
