'use client'

import React, { useEffect, useState, useRef } from "react"
import KdsOrderBlock from "./KdsOrderBlock"
import { KDSOrder, KDSItem, KDSMode } from "@/types/kds"
import { toast } from "react-toastify"

interface KDSContainerProps {
  mode: KDSMode
}

const KDSContainer: React.FC<KDSContainerProps> = ({ mode = "kitchen" }) => {
  const [orders, setOrders] = useState<KDSOrder[]>([])
  const [labeledOrders, setLabeledOrders] = useState<KDSOrder[]>([])
  const [availableHeight, setAvailableHeight] = useState<number>(0)
  const [splitOrders, setSplitOrders] = useState<KDSOrder[]>([])
  const [, setConnected] = useState<boolean>(true)

  const processingCountRef = useRef(0)
  const pendingUpdateRef = useRef(false)
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null)

  // Debounced function to fetch orders after optimistic updates settle
  const scheduleFetchOrders = () => {
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current)
    }
    refreshTimeout.current = setTimeout(() => {
      fetchKDSOrders()
      pendingUpdateRef.current = false
      refreshTimeout.current = null
    }, 200)
  }

  useEffect(() => {
    const updateHeight = () => setAvailableHeight(getAvailableHeight())
    updateHeight()
    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [])

  // Server-Sent Events setup for real-time updates
  useEffect(() => {
    let eventSource: EventSource | null = null
    let lossToast: string | number | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const clearToast = () => {
      if (lossToast == null) return
      toast.update(lossToast, {
        render: "Realtime link re-established",
        type: "success",
        autoClose: 4000,
      })
      lossToast = null
    }

    const markUp = () => {
      setConnected(true)
      clearToast()
    }

    const markDown = () => {
      setConnected(false)
      if (lossToast == null) {
        lossToast = toast.warn("Realtime link lost… attempting to reconnect", {
          autoClose: false,
        })
      }
    }

    const handleUpdate = () => {
      if (processingCountRef.current > 0) {
        pendingUpdateRef.current = true
        return
      }
      fetchKDSOrders()
    }

    const connectEventSource = () => {
      try {
        eventSource = new EventSource('/api/events')
        
        eventSource.onopen = () => {
          console.log('SSE connection opened')
          markUp()
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
            reconnectTimeout = null
          }
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'kds_update') {
              handleUpdate()
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error)
          }
        }

        eventSource.onerror = (error) => {
          console.error('SSE error:', error)
          markDown()
          eventSource?.close()
          
          // Reconnect after delay
          reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect SSE...')
            connectEventSource()
          }, 3000)
        }
      } catch (error) {
        console.error('Error creating EventSource:', error)
        markDown()
      }
    }

    connectEventSource()

    return () => {
      if (eventSource) {
        eventSource.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [])

  // Carousel wheel scroll handling
  useEffect(() => {
    const carousel = document.querySelector(".kds-carousel")
    if (!carousel) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const scrollSpeed = 15
      carousel.scrollLeft += e.deltaY * scrollSpeed
    }

    carousel.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      carousel.removeEventListener("wheel", handleWheel)
    }
  }, [])

  // Label orders with index numbers for hotkeys
  useEffect(() => {
    if (mode === "kitchen") {
      const labeledOrders = orders
        .filter((order) => order.status === "pending")
        .map((order, index) => ({
          ...order,
          i: index + 1,
        }))
      setLabeledOrders(labeledOrders)
    } else if (mode === "recall") {
      const labeledOrders = orders.map((order, index) => ({
        ...order,
        i: index + 1,
      }))
      setLabeledOrders(labeledOrders)
    } else if (mode === "pickup") {
      const labeledOrders = orders.map((order, index) => ({
        ...order,
        i: index + 1,
      }))
      setLabeledOrders(labeledOrders)
    }
  }, [orders, mode])

  useEffect(() => {
    fetchKDSOrders()
  }, [mode])

  const fetchKDSOrders = async () => {
    let orders: KDSOrder[] = []
    processingCountRef.current += 1

    const processOrders = () => {
      processingCountRef.current -= 1
      if (processingCountRef.current === 0) {
        setOrders(orders)
        if (pendingUpdateRef.current) {
          scheduleFetchOrders()
        }
      } else {
        pendingUpdateRef.current = true
      }
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/kds-orders?status=pending`, {
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
          },
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const kitchenOrders = await response.json()
        orders = Array.isArray(kitchenOrders) ? kitchenOrders : []
      } catch (err: unknown) {
        console.error("Error fetching kitchen orders:", err)
        const message = err instanceof Error ? err.message : String(err)
        toast.error("Failed to fetch kitchen orders: " + message)
        orders = []
      } finally {
        processOrders()
      }
    }

    const fetchPickupOrders = async () => {
      try {
        const response = await fetch(`/api/kds-orders?status=ready&status2=pending`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const pickupOrders = await response.json()
        orders = Array.isArray(pickupOrders) ? pickupOrders : []
      } catch (err: unknown) {
        console.error("Error fetching pickup orders:", err)
        const message = err instanceof Error ? err.message : String(err)
        toast.error("Failed to fetch pickup orders: " + message)
        orders = []
      } finally {
        processOrders()
      }
    }

    const fetchFulfilledOrders = async () => {
      try {
        const response = await fetch(`/api/kds-orders?status=all&order_by=updated_at`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const fulfilledOrders = await response.json()
        orders = Array.isArray(fulfilledOrders) ? fulfilledOrders : []
      } catch (err: unknown) {
        console.error("Error fetching fulfilled orders:", err)
        const message = err instanceof Error ? err.message : String(err)
        toast.error("Failed to fetch fulfilled orders: " + message)
        orders = []
      } finally {
        processOrders()
      }
    }

    if (mode === "pickup") {
      await fetchPickupOrders()
    } else if (mode === "recall") {
      await fetchFulfilledOrders()
    } else {
      await fetchOrders()
    }
  }

  const handleItemToggle = async (
    itemId: number,
    status: string,
    orderId: number
  ) => {
    const orderIndex = orders.findIndex((order) => order.id === orderId)
    if (orderIndex === -1) {
      toast.error(`Order with id ${orderId} not found, can't update item status to ${status}`)
      return
    }
    
    processingCountRef.current += 1

    const updatedOrders = [...orders]
    const targetOrder: KDSOrder = { ...orders[orderIndex] }

    targetOrder.items = targetOrder.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            prepared_quantity:
              status === "ready" || status === "fulfilled" ? item.quantity : 0,
            fulfilled_quantity: status === "fulfilled" ? item.quantity : 0,
          }
        : item
    )

    updatedOrders[orderIndex] = targetOrder
    setOrders(updatedOrders)

    try {
      const endpoint =
        status === "fulfilled"
          ? "mark-fulfilled"
          : status === "ready"
          ? "mark-prepared"
          : "unmark"

      await fetch(`/api/kds-items/${itemId}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
        },
      })

      // Check if order status should be updated based on item states
      if (targetOrder.status === "ready") {
        if (targetOrder.items.some(item => item.prepared_quantity !== item.quantity)) {
          handleOrderStatus(orderId, "pending", true, targetOrder)
        }
        if (targetOrder.items.every(item => item.fulfilled_quantity === item.quantity)) {
          handleOrderStatus(orderId, "fulfilled", true, targetOrder)
        }
      } else if (targetOrder.status === "pending") {
        if (targetOrder.items.every(item => item.prepared_quantity === item.quantity)) {
          handleOrderStatus(orderId, "ready", true, targetOrder)
        }
      } else if (targetOrder.status === "fulfilled") {
        if (targetOrder.items.some(item => item.prepared_quantity !== item.quantity)) {
          handleOrderStatus(orderId, "pending", true, targetOrder)
        } else if (targetOrder.items.some(item => item.fulfilled_quantity !== item.quantity)) {
          handleOrderStatus(orderId, "ready", true, targetOrder)
        }
      }
    } catch (error) {
      toast.error("Error updating item status: " + error)
      scheduleFetchOrders()
    } finally {
      processingCountRef.current -= 1
      if (processingCountRef.current === 0 && pendingUpdateRef.current) {
        scheduleFetchOrders()
      }
    }
  }

  const handleOrderStatus = async (
    orderId: number,
    status = "",
    skipItemUpdate = false,
    manualOrder?: KDSOrder
  ) => {
    const order = manualOrder ?? orders.find((order) => order.id === orderId)
    if (!order) {
      toast.error(`Order with id ${orderId} not found, can't update status to ${status}`)
      return
    }

    processingCountRef.current += 1

    if (status === "") {
      status =
        order.status === "pending"
          ? "ready"
          : order.status === "ready"
          ? "fulfilled"
          : "pending"
    }

    try {
      const updatedOrders = [...orders]
      const targetOrderIndex = updatedOrders.findIndex((o) => o.id === orderId)

      const updatedOrder = {
        ...order,
        status: status as "pending" | "ready" | "fulfilled",
        items: skipItemUpdate
          ? order.items
          : order.items.map((item) => ({
              ...item,
              prepared_quantity:
                status === "ready" || status === "fulfilled"
                  ? item.quantity
                  : 0,
              fulfilled_quantity: status === "fulfilled" ? item.quantity : 0,
            })),
      }

      if (targetOrderIndex !== -1) {
        const isPickupAndDone = mode === "pickup" && status === "fulfilled"
        const isKitchenAndDone = mode === "kitchen" && status === "ready"

        if (isPickupAndDone || isKitchenAndDone) {
          updatedOrders.splice(targetOrderIndex, 1)
        } else {
          updatedOrders[targetOrderIndex] = updatedOrder
        }
        setOrders(updatedOrders)
      }

      const response = await fetch(
        `/api/kds-orders/${orderId}/mark-${status}?skipItemUpdate=${skipItemUpdate}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Error marking order ${status}: ${response.statusText}`)
      }
    } catch (error) {
      toast.error(`Error marking order ${status}: ${error}`)
      scheduleFetchOrders()
    } finally {
      processingCountRef.current -= 1
      if (processingCountRef.current === 0 && pendingUpdateRef.current) {
        scheduleFetchOrders()
      }
    }
  }

  const restoreOrder = async (orderId: number) => {
    processingCountRef.current += 1
    const order = orders.find((o) => o.id === orderId)

    const shouldRemove = mode === "pickup" && order?.status === "fulfilled"

    if (shouldRemove) {
      const updatedOrders = orders.filter((o) => o.id !== orderId)
      setOrders(updatedOrders)
    }

    try {
      const updatedOrders = [...orders]
      const index = updatedOrders.findIndex((o) => o.id === orderId)
      if (index !== -1 && order) {
        updatedOrders[index] = {
          ...order,
          status: "pending",
          items: order.items.map((item) => ({
            ...item,
            prepared_quantity: 0,
            fulfilled_quantity: 0,
          })),
        }
        setOrders(updatedOrders)
      }

      const response = await fetch(`/api/kds-orders/${orderId}/mark-pending`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
        },
      })

      if (!response.ok) {
        throw new Error(`Error marking order pending: ${response.statusText}`)
      }
    } catch (error) {
      toast.error("Error marking order pending: " + error)
      scheduleFetchOrders()
    } finally {
      processingCountRef.current -= 1
      if (processingCountRef.current === 0 && pendingUpdateRef.current) {
        scheduleFetchOrders()
      }
    }
  }

  const getItemSummary = (): Record<string, { count: number; color: string }> => {
    const summary: Record<string, { count: number; color: string }> = {}
    
    // Ensure orders is an array
    if (!Array.isArray(orders)) {
      return {
        "Total Orders": {
          count: 0,
          color: "#AAAAAA",
        }
      }
    }

    orders.forEach((order) => {
      // Ensure order.items is an array
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const unpreparedCount = item.quantity - item.prepared_quantity
          if (unpreparedCount > 0) {
            if (!summary[item.item_name]) {
              summary[item.item_name] = {
                count: 0,
                color: getStationColor(item.station),
              }
            }
            summary[item.item_name].count += unpreparedCount
          }
        })
      }
    })

    summary["Total Orders"] = {
      count: orders.length,
      color: "#AAAAAA",
    }

    return summary
  }

  const getStationColor = (station: string): string => {
    switch (station) {
      case 'grill': return 'station-grill'
      case 'prep': return 'station-prep'  
      case 'fryer': return 'station-fryer'
      case 'pickup': return 'station-pickup'
      case 'pizza': return 'station-pizza'
      case 'sweets': return 'station-sweets'
      default: return 'station-default'
    }
  }

  const summary = getItemSummary()

  const HEADER_HEIGHT = 32
  const ITEM_HEIGHT = 45
  const INSTRUCTION_HEIGHT = 30
  const PADDING_HEIGHT = 24

  const getAvailableHeight = (): number => {
    const carousel = document.querySelector(".kds-carousel")
    return carousel ? carousel.clientHeight : window.innerHeight * 0.95
  }

  // Split orders by height if they're too big for one column
  useEffect(() => {
    const splitOrderByHeight = (order: KDSOrder, maxHeight: number): KDSOrder[] => {
      const subOrders: KDSOrder[] = []
      let currentItems: KDSItem[] = []
      let currentHeight = HEADER_HEIGHT + PADDING_HEIGHT

      order.items.forEach((item, idx) => {
        const itemHeight =
          ITEM_HEIGHT +
          (item.special_instructions
            ? item.special_instructions.split(",").length * INSTRUCTION_HEIGHT
            : 0)

        if (currentHeight + itemHeight > maxHeight && currentItems.length > 0) {
          subOrders.push({
            ...order,
            items: currentItems,
            continued: true,
            isFirst: subOrders.length === 0,
            isLast: false,
          })
          currentItems = [item]
          currentHeight = HEADER_HEIGHT + PADDING_HEIGHT + itemHeight
        } else {
          currentItems.push(item)
          currentHeight += itemHeight
        }

        if (idx === order.items.length - 1 && currentItems.length) {
          subOrders.push({
            ...order,
            items: currentItems,
            isFirst: subOrders.length === 0,
            isLast: true,
          })
        }
      })

      return subOrders.map((subOrder, index) => ({
        ...subOrder,
        isFirst: index === 0,
        isLast: index === subOrders.length - 1,
      }))
    }

    const splitOrders = labeledOrders.flatMap((order) =>
      splitOrderByHeight(order, availableHeight * 0.95)
    )
    setSplitOrders(splitOrders)
  }, [labeledOrders, availableHeight])

  return (
    <div className="kds-container">
      <div className="kds-carousel">
        {splitOrders.map((order, index) => (
          <KdsOrderBlock
            key={`${order.id}-${index}`}
            order={order}
            handleOrderStatus={handleOrderStatus}
            handleItemToggle={handleItemToggle}
            restoreOrder={restoreOrder}
            mode={mode}
          />
        ))}
      </div>
      
      {mode === "kitchen" && (
        <div className="kds-summary">
          <ul>
            {Object.entries(summary).map(([itemName, { count, color }]) => (
              <li key={itemName} className={color}>
                {itemName}: {count}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default KDSContainer