import { render, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import KDSContainer from './KDSContainer'

// Mock fetch
global.fetch = vi.fn()

// Mock EventSource
global.EventSource = vi.fn(() => ({
  onopen: null,
  onmessage: null,
  onerror: null,
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})) as unknown as typeof EventSource

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    warn: vi.fn(),
    update: vi.fn(),
  },
}))

describe('KDSContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    })
  })

  it('renders kitchen mode correctly', async () => {
    await act(async () => {
      render(<KDSContainer mode="kitchen" />)
    })
    
    // Should render the main container
    expect(document.querySelector('.kds-carousel')).toBeInTheDocument()
  })

  it('renders pickup mode correctly', async () => {
    await act(async () => {
      render(<KDSContainer mode="pickup" />)
    })
    
    // Should render the main container
    expect(document.querySelector('.kds-carousel')).toBeInTheDocument()
  })

  it('renders recall mode correctly', async () => {
    await act(async () => {
      render(<KDSContainer mode="recall" />)
    })
    
    // Should render the main container
    expect(document.querySelector('.kds-carousel')).toBeInTheDocument()
  })

  it('establishes EventSource connection', async () => {
    await act(async () => {
      render(<KDSContainer mode="kitchen" />)
    })
    
    expect(global.EventSource).toHaveBeenCalledWith('/api/events')
  })

  it('fetches orders on mount', async () => {
    await act(async () => {
      render(<KDSContainer mode="kitchen" />)
    })
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/kds-orders?status=pending', {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
      })
    })
  })
})