import { NextRequest, NextResponse } from 'next/server'
import { queryDB, withTransaction } from '@/lib/db'

interface RouteParams {
  params: {
    id: string
    status: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const orderId = params.id
    const status = params.status.split("-")[1] // Extract status from "mark-{status}"
    const { searchParams } = new URL(request.url)
    const skipItemUpdate = searchParams.get('skipItemUpdate') === 'true'

    if (!["ready", "fulfilled", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status, must be one of: ready, fulfilled, pending" },
        { status: 400 }
      )
    }

    const result = await withTransaction(async (client) => {
      // Apply item-level updates based on order status
      if (status === "ready" && !skipItemUpdate) {
        await client.query(
          `
          UPDATE kitchen_order_items
          SET prepared_quantity = quantity,
              updated_at = NOW()
          WHERE kitchen_order_id = $1 AND prepared_quantity = 0
          `,
          [orderId]
        )
      } else if (status === "fulfilled" && !skipItemUpdate) {
        await client.query(
          `
          UPDATE kitchen_order_items
          SET prepared_quantity = quantity,
              fulfilled_quantity = quantity,
              updated_at = NOW()
          WHERE kitchen_order_id = $1
          `,
          [orderId]
        )
      } else if (status === "pending" && !skipItemUpdate) {
        await client.query(
          `
          UPDATE kitchen_order_items
          SET prepared_quantity = 0,
              fulfilled_quantity = 0,
              updated_at = NOW()
          WHERE kitchen_order_id = $1
          `,
          [orderId]
        )
      }

      // Update the kitchen_orders row
      const updateOrderQuery = `
        UPDATE kitchen_orders
        SET status = $2::order_status, updated_at = NOW()
        WHERE id = $1 OR pos_order_id = $1
        RETURNING *
      `
      const result = await client.query(updateOrderQuery, [orderId, status])

      if (result.rowCount === 0) {
        throw new Error("Order not found")
      }

      return result.rows[0]
    })

    return NextResponse.json({
      success: true,
      order: result,
    })
  } catch (error) {
    console.error(`Error marking order as ${params.status}:`, error)
    return NextResponse.json(
      { error: `Failed to mark order as ${params.status}` },
      { status: 500 }
    )
  }
}