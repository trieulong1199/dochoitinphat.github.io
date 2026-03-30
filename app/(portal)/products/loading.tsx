export default function ProductsLoading() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Danh sách sản phẩm</h1>

      {/* Search bar skeleton */}
      <div className="h-10 bg-gray-200 rounded-md animate-pulse mb-4" />
      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4" />

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="aspect-square bg-gray-200 animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 bg-gray-200 rounded animate-pulse mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
