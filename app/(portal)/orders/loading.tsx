export default function OrdersLoading() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Đơn hàng của tôi</h1>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="space-y-2 text-right">
                <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
