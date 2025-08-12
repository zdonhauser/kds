import type { Meta, StoryObj } from '@storybook/react'
import KdsOrderBlock from './KdsOrderBlock'
import { KDSOrder } from '@/types/kds'

const meta: Meta<typeof KdsOrderBlock> = {
  title: 'KDS/KdsOrderBlock',
  component: KdsOrderBlock,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#000000' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  argTypes: {
    mode: {
      control: 'select',
      options: ['kitchen', 'pickup', 'recall'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const mockOrder: KDSOrder = {
  id: 1,
  pos_order_id: 12345,
  order_number: 123,
  status: 'pending',
  front_released: false,
  is_fulfilled: false,
  name: 'John Doe',
  created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
  updated_at: new Date().toISOString(),
  isFirst: true,
  isLast: true,
  items: [
    {
      id: 1,
      kitchen_order_id: 1,
      item_name: 'Cheeseburger',
      quantity: 2,
      prepared_quantity: 0,
      fulfilled_quantity: 0,
      station: '1',
      special_instructions: 'No pickles, Extra cheese',
    },
    {
      id: 2,
      kitchen_order_id: 1,
      item_name: 'French Fries',
      quantity: 1,
      prepared_quantity: 0,
      fulfilled_quantity: 0,
      station: '2',
      special_instructions: null,
    },
    {
      id: 3,
      kitchen_order_id: 1,
      item_name: 'Coca Cola',
      quantity: 1,
      prepared_quantity: 0,
      fulfilled_quantity: 0,
      station: '3',
      special_instructions: 'Extra ice',
    },
  ],
}

export const PendingOrder: Story = {
  args: {
    order: mockOrder,
    mode: 'kitchen',
    handleOrderStatus: () => {},
    handleItemToggle: () => {},
    restoreOrder: () => {},
  },
}

export const ReadyOrder: Story = {
  args: {
    order: {
      ...mockOrder,
      status: 'ready',
      items: mockOrder.items.map(item => ({
        ...item,
        prepared_quantity: item.quantity,
      })),
    },
    mode: 'pickup',
    handleOrderStatus: () => {},
    handleItemToggle: () => {},
    restoreOrder: () => {},
  },
}

export const FulfilledOrder: Story = {
  args: {
    order: {
      ...mockOrder,
      status: 'fulfilled',
      items: mockOrder.items.map(item => ({
        ...item,
        prepared_quantity: item.quantity,
        fulfilled_quantity: item.quantity,
      })),
    },
    mode: 'recall',
    handleOrderStatus: () => {},
    handleItemToggle: () => {},
    restoreOrder: () => {},
  },
}

export const PartiallyPrepared: Story = {
  args: {
    order: {
      ...mockOrder,
      status: 'pending',
      items: [
        {
          ...mockOrder.items[0],
          prepared_quantity: mockOrder.items[0].quantity, // Fully prepared
        },
        {
          ...mockOrder.items[1],
          prepared_quantity: 0, // Not prepared
        },
        {
          ...mockOrder.items[2],
          prepared_quantity: 0, // Not prepared
        },
      ],
    },
    mode: 'kitchen',
    handleOrderStatus: () => {},
    handleItemToggle: () => {},
    restoreOrder: () => {},
  },
}

export const LongOrder: Story = {
  args: {
    order: {
      ...mockOrder,
      items: [
        ...mockOrder.items,
        {
          id: 4,
          kitchen_order_id: 1,
          item_name: 'Chicken Wings',
          quantity: 12,
          prepared_quantity: 0,
          fulfilled_quantity: 0,
          station: '1',
          special_instructions: 'Buffalo sauce, Extra spicy, Blue cheese on side',
        },
        {
          id: 5,
          kitchen_order_id: 1,
          item_name: 'Garden Salad',
          quantity: 1,
          prepared_quantity: 0,
          fulfilled_quantity: 0,
          station: '4',
          special_instructions: 'Dressing on side, No tomatoes, Add avocado',
        },
      ],
    },
    mode: 'kitchen',
    handleOrderStatus: () => {},
    handleItemToggle: () => {},
    restoreOrder: () => {},
  },
}