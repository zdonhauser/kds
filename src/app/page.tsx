import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">KDS System</h1>
        <p className="text-xl text-gray-300 mb-12">Kitchen Display System</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <Link
            href="/kitchen"
            className="group bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <div className="text-4xl mb-4">👨‍🍳</div>
            <h3 className="text-2xl font-bold text-white mb-2">Kitchen</h3>
            <p className="text-gray-400 group-hover:text-gray-300">
              Order preparation display
            </p>
          </Link>

          <Link
            href="/pickup"
            className="group bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-white mb-2">Pickup</h3>
            <p className="text-gray-400 group-hover:text-gray-300">
              Order fulfillment display
            </p>
          </Link>

          <Link
            href="/recall"
            className="group bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-2xl font-bold text-white mb-2">Recall</h3>
            <p className="text-gray-400 group-hover:text-gray-300">
              Completed orders review
            </p>
          </Link>
        </div>

        <div className="mt-16 text-sm text-gray-500">
          <p>Real-time order tracking • Touch-friendly interface • Multi-station support</p>
        </div>
      </div>
    </div>
  )
}