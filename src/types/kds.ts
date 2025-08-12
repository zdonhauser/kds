export interface KDSItem {
  id: number
  kitchen_order_id: number
  item_name: string
  quantity: number
  prepared_quantity: number
  station: string
  special_instructions: string | null
  fulfilled_quantity: number
  status?: string
  order_id?: number
  created_at?: string
  updated_at?: string
}

export interface KDSOrder {
  i?: number // Index for hotkeys
  id: number
  name?: string | null
  pos_order_id: number
  order_number: number
  status: 'pending' | 'ready' | 'fulfilled'
  front_released: boolean
  is_fulfilled: boolean
  items: KDSItem[]
  created_at: string
  updated_at: string
  continued?: boolean
  isFirst?: boolean
  isLast?: boolean
}

export type KDSMode = 'kitchen' | 'pickup' | 'front' | 'recall'

export interface KDSUpdateEvent {
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  order_id: number
}