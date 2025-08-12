'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const Navigation = () => {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/kitchen', label: 'Kitchen', icon: '👨‍🍳' },
    { href: '/pickup', label: 'Pickup', icon: '📦' },
    { href: '/recall', label: 'Recall', icon: '🔄' },
  ]

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="flex items-center justify-between px-6 py-3">
        <Link href="/" className="text-xl font-bold text-white">
          KDS System
        </Link>
        
        <div className="flex space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${pathname === item.href 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navigation