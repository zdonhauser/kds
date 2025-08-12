import { NextRequest, NextResponse } from 'next/server'
import { queryDB } from '@/lib/db'

interface KDSOrderItem {
  item_name: string
  quantity: number
  prepared_quantity: number
  fulfilled_quantity: number
  station: string
  special_instructions: string | null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const status2 = searchParams.get('status2')
    const orderBy = searchParams.get('order_by')

    // Build WHERE clause
    let whereClause = ""
    if (status && status.toLowerCase() !== "all") {
      const statusFilter = `o.status = '${status}'`
      const status2Filter = status2 && status2 !== "" ? ` OR o.status = '${status2}'` : ""
      whereClause = `WHERE (${statusFilter}${status2Filter}) AND o.updated_at >= NOW() - INTERVAL '12 HOURS'`
    } else {
      whereClause = `WHERE o.updated_at >= NOW() - INTERVAL '12 HOURS'`
    }

    // Validate order_by
    const validOrderBy = ["id", "created_at", "updated_at"]
    const orderByClause = orderBy && validOrderBy.includes(orderBy)
      ? `ORDER BY o.${orderBy} DESC`
      : "ORDER BY o.id ASC"

    const query = `
      SELECT
        o.id as id,
        o.pos_order_id,
        o.order_number,
        o.status,
        o.front_released,
        o.is_fulfilled,
        o.name,
        o.created_at,
        o.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', i.id,
              'item_name', i.item_name,
              'quantity', i.quantity,
              'prepared_quantity', i.prepared_quantity,
              'fulfilled_quantity', i.fulfilled_quantity,
              'station', i.station,
              'special_instructions', i.special_instructions,
              'created_at', i.created_at,
              'updated_at', i.updated_at
            )
            ORDER BY i.id ASC
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) AS items
      FROM kitchen_orders o
      LEFT JOIN kitchen_order_items i ON o.id = i.kitchen_order_id
      ${whereClause}
      GROUP BY o.id
      ${orderByClause}
    `

    const result = await queryDB(query)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching KDS orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch KDS orders" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pos_order_id, order_number, items, status, name } = await request.json()

    if (!pos_order_id || !order_number || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      )
    }

    // Insert new order
    const orderQuery = `
      INSERT INTO kitchen_orders (pos_order_id, order_number, status, front_released, is_fulfilled, name)
      VALUES ($1, $2, $3, false, false, $4)
      RETURNING id
    `
    const orderResult = await queryDB(orderQuery, [pos_order_id, order_number, status, name])
    const kitchenOrderId = orderResult.rows[0].id

    // Insert items if any
    if (items.length > 0) {
      const valueClauses = items
        .map((_, index) => 
          `($${index * 7 + 1}, $${index * 7 + 2}, $${index * 7 + 3}, $${index * 7 + 4}, $${index * 7 + 5}, $${index * 7 + 6}, $${index * 7 + 7})`
        )
        .join(", ")

      const values = items.flatMap((item: KDSOrderItem) => [
        kitchenOrderId,
        item.item_name,
        item.quantity,
        item.station,
        item.special_instructions || null,
        item.prepared_quantity !== undefined ? item.prepared_quantity : 0,
        item.fulfilled_quantity !== undefined ? item.fulfilled_quantity : 0,
      ])

      const itemsQuery = `
        INSERT INTO kitchen_order_items 
          (kitchen_order_id, item_name, quantity, station, special_instructions, prepared_quantity, fulfilled_quantity)
        VALUES ${valueClauses}
      `
      await queryDB(itemsQuery, values)
    }

    return NextResponse.json({
      success: true,
      kitchen_order_id: kitchenOrderId,
    })
  } catch (error) {
    console.error("Error creating KDS order:", error)
    return NextResponse.json(
      { error: "Failed to create KDS order" },
      { status: 500 }
    )
  }
}