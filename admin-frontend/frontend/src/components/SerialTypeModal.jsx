import { Link } from 'react-router-dom'

function SerialTypeModal({ isOpen, onClose, doctorId }) {
  if (!isOpen) return null

  const paidBenefits = [
    { icon: '1️⃣', text: 'সিরিয়াল প্রথমে হবে - অপেক্ষার সময় কম' },
    { icon: '👨‍💼', text: 'আমাদের একজন প্রতিনিধি উপস্থিত থাকবে' },
    { icon: '📄', text: 'প্রেসক্রিপশন অনলাইনে থাকবে - বুকিং আইডি দিয়ে ডাউনলোড করা যাবে' },
    { icon: '💊', text: 'আমাদের কাছে ঔষুধ কিনলে ১০% ডিসকাউন্ট পাবেন' }
  ]

  const regularDrawbacks = [
    { icon: '⏳', text: 'সিরিয়াল মধ্যে বা শেষের দিকে হয় - অনেক সময় নষ্ট হয়' },
    { icon: '❌', text: 'আমাদের কোনো প্রতিনিধি উপস্থিত থাকবে না' },
    { icon: '📵', text: 'প্রেসক্রিপশন ডাউনলোড করার সুবিধা থাকবে না' },
    { icon: '💊', text: 'আমাদের কাছে ঔষুধ কিনলে ১০% ডিসকাউন্ট পাবেন' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full animate-fade-in my-4 max-h-[95vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="sticky top-2 sm:top-4 right-2 sm:right-4 ml-auto w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10 mb-2"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4 sm:p-6 md:p-8 pt-0">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">সিরিয়ালের ধরণ বাছাই করুন</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">পেইড সিরিয়াল নিলে আপনার সময় ও টাকা দুটোই সাশ্রয় হবে</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 rounded-xl p-4 sm:p-5 md:p-6 flex flex-col">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-pink-700">পেইড সিরিয়াল</h3>
                  <p className="text-pink-600 text-xs sm:text-sm">প্রিমিয়াম সুবিধা সহ</p>
                </div>
              </div>

              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 flex-grow">
                {paidBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-base sm:text-lg flex-shrink-0">{benefit.icon}</span>
                    <span className="text-gray-700 text-xs sm:text-sm leading-relaxed">{benefit.text}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-pink-200/50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                <p className="text-pink-800 text-xs sm:text-sm font-medium text-center">
                  বিকাশ পেমেন্ট এর মাধ্যমে বুকিং নিশ্চিত করুন
                </p>
              </div>

              <Link 
                to={`/paid-book/${doctorId}`}
                onClick={onClose}
                className="block w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white text-center py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                পেইড সিরিয়াল নিন
              </Link>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4 sm:p-5 md:p-6 flex flex-col">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-700">সাধারন সিরিয়াল</h3>
                  <p className="text-gray-500 text-xs sm:text-sm">বেসিক সুবিধা</p>
                </div>
              </div>

              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 flex-grow">
                {regularDrawbacks.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-base sm:text-lg flex-shrink-0">{item.icon}</span>
                    <span className="text-gray-600 text-xs sm:text-sm leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-gray-200/50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                <p className="text-gray-600 text-xs sm:text-sm font-medium text-center">
                  বিনামূল্যে বুকিং - চেম্বারে ফি প্রদান করুন
                </p>
              </div>

              <Link 
                to={`/book/${doctorId}`}
                onClick={onClose}
                className="block w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-center py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                সাধারন সিরিয়াল নিন
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SerialTypeModal
