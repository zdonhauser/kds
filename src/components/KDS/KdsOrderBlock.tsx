'use client'

import React, { useEffect, useRef, useState } from "react"
import { KDSOrder, KDSMode } from "@/types/kds"

interface KdsOrderBlockProps {
  order: KDSOrder
  handleOrderStatus: (orderId: number, status?: string) => void
  restoreOrder: (orderId: number) => void
  handleItemToggle: (itemId: number, status: string, orderId: number) => void
  mode: KDSMode
}

const KdsOrderBlock: React.FC<KdsOrderBlockProps> = ({
  order,
  handleOrderStatus,
  handleItemToggle,
  restoreOrder,
  mode,
}) => {
  const startTimerRef = useRef<NodeJS.Timeout | null>(null)
  const completeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggeredRef = useRef<boolean>(false)
  const longPressActiveRef = useRef<boolean>(false)
  const [isLongPressActive, setIsLongPressActive] = useState(false)

  const isScrollingRef = useRef(false)
  const touchMoveListenerRef = useRef<(e: TouchEvent) => void>()
  const touchEndListenerRef = useRef<(e: TouchEvent) => void>()
  const cancelLongPressOnMoveRef = useRef<(e: TouchEvent) => void>()

  const calculateElapsedTime = (createdAt: string, updatedAt?: string): string => {
    const now = new Date()
    const createdTime = new Date(createdAt)
    let diff = now.getTime() - createdTime.getTime()

    if (updatedAt) {
      const updatedTime = new Date(updatedAt)
      diff = updatedTime.getTime() - createdTime.getTime()
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    const pad = (num: number) => String(num).padStart(2, "0")
    if (hours == 0 && minutes == 0 && seconds == 0) {
      return '--'
    } else if (hours == 0 && minutes == 0) {
      return `${pad(seconds)}s`
    } else if (hours == 0) {
      return `${pad(minutes)}:${pad(seconds)}`
    } else {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    }
  }

  const [elapsedTime, setElapsedTime] = useState<string>(
    calculateElapsedTime(order.created_at)
  )

  const [completionTime, setCompletionTime] = useState<string>(
    calculateElapsedTime(order.created_at, order.updated_at)
  )

  useEffect(() => {
    const intervalId = setInterval(() => {
      setElapsedTime(calculateElapsedTime(order.created_at))
    }, 1000)

    return () => clearInterval(intervalId)
  }, [order.created_at])

  useEffect(() => {
    let lastKeyPressed: string | null = null
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key
      if (!order.i) return
      if (
        lastKeyPressed === key &&
        !isNaN(Number(key)) &&
        Number(key) == order.i
      ) {
        handleOrderStatus(order.id)
      }
      lastKeyPressed = key
      setTimeout(() => {
        lastKeyPressed = null
      }, 200)
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [order.i, order.id, handleOrderStatus])

  const oldestFirstItems = [...order.items].sort((a, b) => a.id - b.id)

  const toggleItemStatus = (itemId: number, currentStatus: string) => {
    if (isScrollingRef.current) return
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false
      return
    }
    let newStatus: "pending" | "ready" | "fulfilled" = "ready"

    if (currentStatus === "ready") {
      if (mode === "pickup") newStatus = "fulfilled"
      else if (mode === "kitchen") return
    }
    if (currentStatus === "fulfilled") return
    handleItemToggle(itemId, newStatus, order.id)
  }

  const reverseToggleItemStatus = (itemId: number, currentStatus: string) => {
    let newStatus = "pending"
    if (currentStatus === "fulfilled") {
      newStatus = "ready"
    }
    handleItemToggle(itemId, newStatus, order.id)
  }

  const handleMouseDown = (itemId: number, currentStatus: string) => {
    startTimerRef.current = setTimeout(() => {
      reverseToggleItemStatus(itemId, currentStatus)
      longPressTriggeredRef.current = true
      startTimerRef.current = null
    }, 500)
  }

  const handleOrderLongPressStart = () => {
    if (order.status === "pending") return
    startTimerRef.current = setTimeout(() => {
      setIsLongPressActive(true)
      longPressActiveRef.current = true
    }, 100)

    completeTimerRef.current = setTimeout(() => {
      restoreOrder(order.id)
      longPressTriggeredRef.current = true

      setTimeout(() => {
        setIsLongPressActive(false)
        longPressActiveRef.current = false
      }, 1000)

      startTimerRef.current = null
      completeTimerRef.current = null
    }, 1000)
  }

  const handleTouchStart = () => {
    isScrollingRef.current = false
    handleOrderLongPressStart()

    cancelLongPressOnMoveRef.current = () => {
      if (!isScrollingRef.current) {
        isScrollingRef.current = true
        handleMouseUpOrLeave()
      }
    }
    window.addEventListener(
      "touchmove",
      cancelLongPressOnMoveRef.current,
      { passive: true }
    )
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    isScrollingRef.current = true
    handleMouseUpOrLeave()
  }

  const handleOrderClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false
      return
    }
    if (order.status !== "fulfilled") handleOrderStatus(order.id)
    else restoreOrder(order.id)
  }

  const handleMouseUpOrLeave = () => {
    if (startTimerRef.current) clearTimeout(startTimerRef.current)
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current)
    startTimerRef.current = null
    completeTimerRef.current = null

    isScrollingRef.current = false

    if (longPressActiveRef.current) {
      longPressActiveRef.current = false
      setIsLongPressActive(false)
    }

    if (touchMoveListenerRef.current) {
      window.removeEventListener("touchmove", touchMoveListenerRef.current)
      touchMoveListenerRef.current = undefined
    }
    if (touchEndListenerRef.current) {
      window.removeEventListener("touchend", touchEndListenerRef.current)
      touchEndListenerRef.current = undefined
    }
    if (cancelLongPressOnMoveRef.current) {
      window.removeEventListener(
        "touchmove",
        cancelLongPressOnMoveRef.current
      )
      cancelLongPressOnMoveRef.current = undefined
    }
  }

  return (
    <div
      className={`
        bg-gray-800 border border-gray-600 rounded-lg p-4 min-w-80 max-w-80
        ${order.status === 'pending' ? 'border-yellow-500' : ''}
        ${order.status === 'ready' ? 'border-green-500' : ''}
        ${order.status === 'fulfilled' ? 'border-blue-500' : ''}
        ${order.isFirst ? 'mt-0' : ''}
        ${order.isLast ? 'mb-0' : ''}
      `}
      key={order.id}
    >
      {order.isFirst && (
        <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2">
          <h3
            className="text-xl font-bold border border-white rounded px-2 py-1 cursor-pointer select-none"
            onMouseDown={handleOrderLongPressStart}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
            onTouchCancel={handleMouseUpOrLeave}
            onContextMenu={(e) => e.preventDefault()}
            onClick={handleOrderClick}
          >
            {isLongPressActive && order.status !== "pending"
              ? "Hold to Mark Pending"
              : `${order.order_number.toString().slice(-3)}`}
          </h3>
          {order.name && (
            <h3
              className="text-lg font-semibold cursor-pointer select-none"
              onMouseDown={handleOrderLongPressStart}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUpOrLeave}
              onTouchCancel={handleMouseUpOrLeave}
              onContextMenu={(e) => e.preventDefault()}
              onClick={handleOrderClick}
            >
              {order.name || ""}
            </h3>
          )}
          <div className="text-sm font-mono">
            {["ready", "fulfilled"].includes(order.status) ? (
              <b className="text-green-400">{completionTime}</b>
            ) : (
              <i className="text-yellow-400">{elapsedTime}</i>
            )}
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {oldestFirstItems.map((item) => {
          const status =
            item.prepared_quantity === item.quantity
              ? item.fulfilled_quantity === item.quantity
                ? "fulfilled"
                : "ready"
              : "pending"
          
          return (
            <li key={item.id} className="flex items-start space-x-3">
              <label
                className="flex items-start space-x-2 cursor-pointer select-none w-full"
                onMouseDown={() => handleMouseDown(item.id, status)}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={() => handleMouseDown(item.id, status)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUpOrLeave}
                onTouchCancel={handleMouseUpOrLeave}
                onContextMenu={(e) => e.preventDefault()}
              >
                <input
                  type="checkbox"
                  checked={status !== "pending"}
                  readOnly
                  onChange={() => toggleItemStatus(item.id, status)}
                  className={`
                    mt-1 w-4 h-4 rounded border-2
                    ${status === 'pending' ? 'border-gray-400 bg-gray-700' : ''}
                    ${status === 'ready' ? 'border-green-400 bg-green-600' : ''}
                    ${status === 'fulfilled' ? 'border-blue-400 bg-blue-600' : ''}
                  `}
                />
                <div className="flex-1">
                  <div className={`
                    font-medium
                    ${status === 'pending' ? 'text-white' : ''}
                    ${status === 'ready' ? 'text-green-300' : ''}
                    ${status === 'fulfilled' ? 'text-blue-300' : ''}
                    ${item.station === '1' ? 'border-l-4 border-red-400 pl-2' : ''}
                    ${item.station === '2' ? 'border-l-4 border-blue-400 pl-2' : ''}
                    ${item.station === '3' ? 'border-l-4 border-green-400 pl-2' : ''}
                    ${item.station === '4' ? 'border-l-4 border-yellow-400 pl-2' : ''}
                  `}>
                    {item.quantity !== 1 ? `${item.quantity} × ` : ""}{item.item_name}
                  </div>
                  {item.special_instructions && (
                    <div className="text-sm text-gray-400 mt-1 ml-2">
                      {item.special_instructions
                        .split(",")
                        .map((instruction, idx) => (
                          <div key={`${instruction}-${idx}`} className="italic">
                            {instruction.split(":")[1]?.trim() || instruction}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </label>
            </li>
          )
        })}
      </ul>

      {order.isLast && (
        <div
          className="mt-4 pt-4 border-t border-gray-600"
          onMouseDown={handleOrderLongPressStart}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUpOrLeave}
          onTouchCancel={handleMouseUpOrLeave}
          onContextMenu={(e) => e.preventDefault()}
        >
          {order.status === "pending" && (
            <button
              className={`
                w-full py-2 px-4 rounded font-semibold transition-colors
                bg-green-600 hover:bg-green-700 text-white
                ${isLongPressActive ? 'animate-pulse bg-red-600' : ''}
              `}
              onClick={() => handleOrderStatus(order.id, "ready")}
            >
              {isLongPressActive ? "Mark Pending" : "Mark Ready"}
            </button>
          )}
          {order.status === "ready" && (
            <button
              className={`
                w-full py-2 px-4 rounded font-semibold transition-colors
                bg-blue-600 hover:bg-blue-700 text-white
                ${isLongPressActive ? 'animate-pulse bg-red-600' : ''}
              `}
              onClick={() => handleOrderStatus(order.id, "fulfilled")}
            >
              {isLongPressActive ? "Mark Pending" : "Mark Fulfilled"}
            </button>
          )}
          {order.status === "fulfilled" && (
            <button
              className={`
                w-full py-2 px-4 rounded font-semibold transition-colors
                bg-gray-600 hover:bg-gray-700 text-white
                ${isLongPressActive ? 'animate-pulse bg-red-600' : ''}
              `}
              onClick={() => restoreOrder(order.id)}
            >
              {isLongPressActive ? "Mark Pending" : "Reverse"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default KdsOrderBlock