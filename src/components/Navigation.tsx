'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const handleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <div className={`nav no-print ${isOpen ? 'nav-open' : 'nav-closed'}`}>
      <span className="navlink">
        <span onClick={handleMenu}>
          <img src="/menu.png" height="25" alt="" />
          <span className="navtext">Menu</span>
        </span>
      </span>

      <span className="navlink">
        <Link href="/kitchen" onClick={closeMenu}>
          <img src="/kds.png" height="25" alt="" />
          <span className="navtext">Kitchen KDS</span>
        </Link>
      </span>

      <span className="navlink">
        <Link href="/pickup" onClick={closeMenu}>
          <img src="/pickup.png" height="25" alt="" />
          <span className="navtext">Pickup KDS</span>
        </Link>
      </span>

      <span className="navlink">
        <Link href="/recall" onClick={closeMenu}>
          <img src="/recall.png" height="25" alt="" />
          <span className="navtext">Recall KDS</span>
        </Link>
      </span>
    </div>
  )
}

export default Navigation