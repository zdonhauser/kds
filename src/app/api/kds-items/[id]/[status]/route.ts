import { NextRequest, NextResponse } from 'next/server'
import { queryDB } from '@/lib/db'

interface RouteParams {
  params: {
    id: string
    status: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: itemId, status } = params
  
  if (!["mark-prepared", "mark-fulfilled", "unmark", "mark-pending"].includes(status)) {
    return NextResponse.json({
      error: "Invalid status, must be one of: mark-prepared, mark-fulfilled, unmark, mark-pending",
    }, { status: 400 })
  }

  try {
    const updateQuery = `
      UPDATE kitchen_order_items
      SET prepared_quantity = (
        CASE $2
          WHEN 'mark-prepared' THEN quantity
          WHEN 'mark-fulfilled' THEN quantity
          WHEN 'unmark' THEN 0
          WHEN 'mark-pending' THEN 0
          ELSE prepared_quantity
        END
      ),
      fulfilled_quantity = (
        CASE $2
          WHEN 'mark-fulfilled' THEN quantity
          WHEN 'unmark' THEN 0
          WHEN 'mark-pending' THEN 0
          WHEN 'mark-prepared' THEN 0
          ELSE fulfilled_quantity
        END
      ),
      updated_at = (CASE $2 WHEN 'mark-prepared' THEN NOW() ELSE updated_at END)
      WHERE id = $1
      RETURNING id, prepared_quantity, fulfilled_quantity, quantity
    `
    
    const result = await queryDB(updateQuery, [itemId, status])

    if (result.rowCount === 0) {
      return NextResponse.json({
        error: "Item is already fully prepared or does not exist"
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      item: result.rows,
    })
  } catch (error) {
    console.error(`Error marking item as ${status}:`, error)
    return NextResponse.json({
      error: `Failed to mark item as ${status}`
    }, { status: 500 })
  }
}