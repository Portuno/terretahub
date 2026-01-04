# Critical Path Performance Optimizations

## Current Performance Issues

### Critical Path Latency: 1.98s
- `/proyectos` route: 498ms
- Google Fonts CSS: 504ms
- Font files: 1.27s - 1.98s
- Main JS bundle: 1.04s
- Main CSS: 505ms

### Supabase Query Performance
- **Profile query**: 747ms ✅ (acceptable)
- **Load projects**: 1402ms ⚠️ (slow)
- **Load author profiles**: 5449ms ❌ (very slow - 5.4 seconds!)
- **Load link bio avatars**: 4288ms ❌ (very slow - 4.3 seconds!)

## Optimizations Applied

### 1. Parallel Query Execution
**Location:** `components/ProjectsGallery.tsx`

**Before:**
```typescript
// Sequential execution
const profiles = await loadProfiles(); // 5.4s
const avatars = await loadAvatars();   // 4.3s
// Total: 9.7s
```

**After:**
```typescript
// Parallel execution
const [profiles, avatars] = await Promise.all([
  loadProfiles(),  // 5.4s
  loadAvatars()    // 4.3s
]);
// Total: 5.4s (max of both)
```

**Impact**: Reduces total query time from **9.7s to 5.4s** (44% improvement)

### 2. Font Loading Optimization
**Location:** `index.html` and `src/index.css`

- Added system font fallback in CSS
- Improved async font loading with `media="print"` trick
- Fonts load asynchronously without blocking render

**Impact**: 
- Text visible immediately with system fonts
- Custom fonts swap in when loaded
- Reduces perceived load time

### 3. Supabase Preconnect
**Location:** `index.html`

- Added preconnect for Supabase API
- Should establish connection early

**Note**: If preconnect shows as "unused", verify:
1. The Supabase URL is correct
2. The `crossorigin` attribute is properly set
3. Requests are actually going to that domain

## Remaining Issues & Recommendations

### 1. Database Query Performance (CRITICAL)
The queries are still very slow (5.4s for profiles, 4.3s for avatars).

**Root Cause Analysis:**
- Queries use `.in('id', authorIds)` which should be fast with indexes
- Likely RLS (Row Level Security) policies are causing slow queries
- May need to verify indexes were applied correctly

**Actions Required:**
1. ✅ **Apply database indexes** (`supabase/15_add_performance_indexes.sql`)
   - Composite index on `profiles(id)` (primary key should already be indexed)
   - Composite index on `link_bio_profiles(user_id)`
   - Verify indexes exist: `\d+ profiles` and `\d+ link_bio_profiles` in Supabase SQL editor

2. ✅ **Verify RLS policies are optimized**
   - Check that policies use `(select auth.uid())` not `auth.uid()`
   - Ensure policies are simple and don't cause subqueries per row

3. **Consider query optimization:**
   - If `authorIds` array is very large, consider batching
   - Check if PostgREST is using indexes (use `EXPLAIN` in Supabase)

### 2. Font Loading
Fonts are still taking 1.27s - 1.98s to load.

**Recommendations:**
1. **Self-host fonts** (best performance):
   - Download fonts from Google Fonts
   - Host on your CDN
   - Use `@font-face` with `woff2` format
   - Better caching and control

2. **Font subsetting**:
   - Only load used characters
   - Use `text=` parameter in Google Fonts URL
   - Reduces file size significantly

3. **Consider variable fonts**:
   - Single file for all weights
   - Smaller total file size

### 3. Code Splitting
Main JS bundle is 1.04s.

**Already Applied:**
- ✅ Route-based code splitting
- ✅ Vendor chunk separation

**Additional Recommendations:**
1. **Lazy load routes:**
   ```typescript
   const ProjectsPage = lazy(() => import('./components/ProjectsPage'));
   ```

2. **Preload critical routes:**
   ```html
   <link rel="modulepreload" href="/public-routes.js">
   ```

### 4. CSS Optimization
Main CSS is 505ms.

**Already Applied:**
- ✅ Critical CSS inlined
- ✅ CSS code splitting enabled

**Additional Recommendations:**
1. **Purge unused CSS** (Tailwind should handle this)
2. **Minify CSS** (already enabled)
3. **Consider CSS-in-JS for route-specific styles**

## Performance Targets

### Current
- Critical path: **1.98s** ❌
- LCP: **1.90s** ❌
- Query time: **9.7s → 5.4s** (after parallelization)

### Target
- Critical path: **< 1.0s** ✅
- LCP: **< 2.5s** ✅ (current is close)
- Query time: **< 1.0s** (with indexes)

## Next Steps (Priority Order)

1. **🔴 CRITICAL: Apply database indexes**
   - Run `supabase/15_add_performance_indexes.sql`
   - Verify indexes were created
   - Test query performance

2. **🟡 HIGH: Verify RLS policies**
   - Check that all policies use `(select auth.uid())`
   - Run `supabase/11_optimize_rls_policies.sql` if needed

3. **🟡 HIGH: Monitor query performance**
   - Use Supabase dashboard to check query times
   - Use `EXPLAIN` to verify index usage

4. **🟢 MEDIUM: Optimize fonts**
   - Consider self-hosting
   - Implement font subsetting

5. **🟢 LOW: Additional code splitting**
   - Lazy load non-critical routes
   - Preload critical routes

## Testing Checklist

After applying optimizations:

- [ ] Database indexes applied and verified
- [ ] Query times reduced to < 1s
- [ ] Fonts load asynchronously (no render blocking)
- [ ] Critical path latency < 1.0s
- [ ] LCP < 2.5s
- [ ] No render-blocking resources in Lighthouse
- [ ] Preconnect hints are being used (check Network tab)

## Monitoring

Use these tools to monitor performance:
- **Lighthouse** (Chrome DevTools)
- **Supabase Dashboard** (Query performance)
- **Chrome DevTools Network tab** (Request timing)
- **Web Vitals** (Real user metrics)

