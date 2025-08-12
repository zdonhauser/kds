import { getClient } from '@/lib/db'

// Store active connections
const connections = new Set<ReadableStreamDefaultController>()

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      connections.add(controller)
      
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      
      console.log('SSE client connected. Total connections:', connections.size)
    },
    cancel() {
      connections.delete(controller)
      console.log('SSE client disconnected. Total connections:', connections.size)
    }
  })

  // Set up PostgreSQL notifications (only once)
  if (connections.size === 1) {
    setupPostgreSQLNotifications()
  }

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}

async function setupPostgreSQLNotifications() {
  try {
    const client = await getClient()
    
    await client.query('LISTEN kds_order_update')
    console.log('Now listening for kds_order_update notifications via SSE.')

    client.on('notification', (msg) => {
      console.log('PostgreSQL notification received:', msg)
      
      // Broadcast to all connected clients
      const eventData = JSON.stringify({
        type: 'kds_update',
        data: msg.payload || 'update',
        timestamp: new Date().toISOString()
      })

      connections.forEach((controller) => {
        try {
          controller.enqueue(`data: ${eventData}\n\n`)
        } catch (error) {
          console.error('Error sending SSE message:', error)
          connections.delete(controller)
        }
      })
    })

    client.on('error', (err) => {
      console.error('PostgreSQL notification client error:', err)
    })

  } catch (err) {
    console.error('Error setting up PostgreSQL notifications:', err)
  }
}

// Utility function to broadcast messages to all connections
export function broadcastToClients(data: unknown) {
  const eventData = JSON.stringify(data)
  
  connections.forEach((controller) => {
    try {
      controller.enqueue(`data: ${eventData}\n\n`)
    } catch (error) {
      console.error('Error broadcasting message:', error)
      connections.delete(controller)
    }
  })
}