# Performance Optimization Guide

## Changes Made for Mobile Performance

### 1. **Service Worker & Offline Caching** (`public/service-worker.js`)
- Caches static assets (JS, CSS, images) with cache-first strategy
- API responses cached with network-first strategy
- Enables offline functionality
- Automatically clears old cache versions

### 2. **API Response Caching** (`src/lib/cacheManager.js`)
- In-memory cache for API responses (5-minute default)
- Prevents redundant API calls when navigating between screens
- Automatic cache expiration
- Fallback to stale cache on network errors

**Usage in components:**
```javascript
import { cacheManager } from '../lib/cacheManager'

// Wrap your API calls
const data = await cacheManager.getOrFetch(
  'doctors-list',
  () => supabase.from('doctors').select('*'),
  10 * 60 * 1000 // 10 minute cache
)
```

### 3. **Lazy Image Loading** (`src/components/LazyImage.jsx`)
- Native lazy loading with Intersection Observer
- Supports WebP with PNG fallback for better compression
- Reduces initial load and improves First Contentful Paint

**Usage:**
```jsx
import LazyImage from '../components/LazyImage'

<LazyImage 
  src="/doctor.png"
  srcWebp="/doctor.webp"
  alt="Doctor profile"
  loading="lazy"
/>
```

### 4. **Build Optimizations** (`vite.config.js`)
- Aggressive code splitting for mobile
- Smaller chunk size warnings (500KB)
- Excludes react-quill from pre-bundling
- Better CommonJS optimization

### 5. **HTML Head Optimizations** (`index.html`)
- Added preload for critical assets
- Improved font loading strategy
- Added viewport-fit for notch support
- Prevent layout shift with CSS

## Expected Performance Improvements

These changes should improve:
- **First Contentful Paint**: 4.1s → ~2.5-3s
- **Largest Contentful Paint**: 4.3s → ~2.8-3.5s
- **Speed Index**: 4.1s → ~3-3.5s
- **Performance Score**: 76 → ~85-90

## Deployment Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Performance: Add service worker, caching, and optimizations"
   git push
   ```

2. **Vercel Auto-deployment:**
   - Service worker will be automatically served
   - Build optimizations apply automatically
   - Check build logs for any warnings

3. **Monitor Performance:**
   - Run PageSpeed Insights again after deployment
   - Check Network tab in DevTools
   - Monitor Service Worker registration in Application tab

## Next Steps (If Score < 95)

1. **Convert more images to WebP**
   - Use LazyImage component for all images
   - Ensure WebP fallbacks exist

2. **Optimize Supabase queries**
   - Add pagination to data fetching
   - Reduce initial data size

3. **Implement route-based code splitting**
   - Already done with lazy() imports
   - Monitor chunk sizes in build output

4. **Consider CDN for images**
   - Cloudinary or similar for image optimization

5. **Compress JSON responses**
   - Backend compression with gzip

## Testing

1. Clear browser cache: DevTools → Application → Clear Storage → Clear Site Data
2. Use Chrome DevTools throttling: Network tab → Slow 4G
3. Run Lighthouse multiple times
4. Test on real mobile device
