import { NextRequest } from 'next/server'
import { Server } from 'socket.io'
import { Server as NetServer } from 'http'
import { getClient } from '@/lib/db'

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'development') {
    if (!(global as any).io) {
      console.log('Starting Socket.IO server...')
      
      const httpServer: NetServer = (req as any).socket.server
      const io = new Server(httpServer, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
          origin: "*",
        },
      })

      // PostgreSQL LISTEN/NOTIFY setup
      const setupNotifications = async () => {
        try {
          const client = await getClient()
          
          await client.query('LISTEN kds_order_update')
          console.log('Now listening for kds_order_update notifications.')

          client.on('notification', (msg) => {
            console.log('PostgreSQL notification:', msg)
            io.emit('kds_update', 'kds needs to update')
          })

          // Keep the client alive
          client.on('error', (err) => {
            console.error('PostgreSQL notification client error:', err)
          })

        } catch (err) {
          console.error('Error setting up PostgreSQL notifications:', err)
        }
      }

      io.on('connection', (socket) => {
        console.log('Socket.IO client connected:', socket.id)
        
        socket.on('disconnect', () => {
          console.log('Socket.IO client disconnected:', socket.id)
        })
      })

      setupNotifications()
      ;(global as any).io = io
    }
    
    return new Response('Socket.IO server started', { status: 200 })
  }
  
  return new Response('Socket.IO not available in production', { status: 404 })
}