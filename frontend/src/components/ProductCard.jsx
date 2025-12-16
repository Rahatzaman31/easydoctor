import { Link } from 'react-router-dom'

function ProductCard({ product, size = 'default' }) {
  const hasDiscount = product.sale_price && product.sale_price < product.price
  const isLarge = size === 'large'

  return (
    <Link 
      to={`/product/${product.id}`}
      className={`group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary-200 flex flex-col ${isLarge ? 'rounded-2xl' : 'rounded-lg'}`}
    >
      <div className={`relative overflow-hidden bg-gray-50 ${isLarge ? 'aspect-square' : 'aspect-[4/3]'}`}>
        <img 
          src={product.image_url || 'https://via.placeholder.com/300x300?text=Product'} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.is_featured && (
          <div className={`absolute ${isLarge ? 'top-2 right-2 text-xs px-2 py-1' : 'top-1 right-1 text-[10px] px-1.5 py-0.5'} bg-amber-500 text-white font-bold rounded flex items-center gap-0.5`}>
            <svg className={`${isLarge ? 'w-3 h-3' : 'w-2.5 h-2.5'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}
      </div>
      
      <div className={`${isLarge ? 'p-4' : 'p-2'} flex-1 flex flex-col`}>
        <h3 className={`${isLarge ? 'text-sm md:text-base' : 'text-xs'} font-medium text-gray-800 line-clamp-2 group-hover:text-primary-600 transition-colors mb-2`}>
          {product.name}
        </h3>
        
        <div className="mt-auto">
          {hasDiscount ? (
            <div className={`flex items-center ${isLarge ? 'gap-2' : 'gap-1'}`}>
              <span className={`${isLarge ? 'text-lg md:text-xl' : 'text-sm'} font-bold text-primary-600`}>৳{product.sale_price}</span>
              <span className={`${isLarge ? 'text-sm' : 'text-[10px]'} text-gray-400 line-through`}>৳{product.price}</span>
            </div>
          ) : (
            <span className={`${isLarge ? 'text-lg md:text-xl' : 'text-sm'} font-bold text-primary-600`}>৳{product.price}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
