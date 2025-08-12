import { Server } from 'socket.io'
import { createServer } from 'http'
import { getClient } from './db'

export class SocketIOServer {
  private io: Server | null = null
  private httpServer: any = null

  async initialize(server?: any) {
    if (this.io) {
      return this.io
    }

    // Use provided server or create new one
    this.httpServer = server || createServer()
    
    this.io = new Server(this.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    // Set up connection handling
    this.io.on('connection', (socket) => {
      console.log('Socket.IO client connected:', socket.id)
      
      socket.on('disconnect', () => {
        console.log('Socket.IO client disconnected:', socket.id)
      })

      socket.on('error', (error) => {
        console.error('Socket.IO error:', error)
      })
    })

    // Set up PostgreSQL notifications
    await this.setupNotifications()

    return this.io
  }

  private async setupNotifications() {
    try {
      const client = await getClient()
      
      await client.query('LISTEN kds_order_update')
      console.log('Now listening for kds_order_update notifications.')

      client.on('notification', (msg) => {
        console.log('PostgreSQL notification received:', msg)
        if (this.io) {
          this.io.emit('kds_update', {
            type: 'kds_order_update',
            data: msg.payload
          })
        }
      })

      client.on('error', (err) => {
        console.error('PostgreSQL notification client error:', err)
        // Attempt to reconnect
        setTimeout(() => this.setupNotifications(), 5000)
      })

    } catch (err) {
      console.error('Error setting up PostgreSQL notifications:', err)
      // Retry after delay
      setTimeout(() => this.setupNotifications(), 5000)
    }
  }

  getIO() {
    return this.io
  }

  emit(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data)
    }
  }

  async close() {
    if (this.io) {
      this.io.close()
      this.io = null
    }
    if (this.httpServer) {
      this.httpServer.close()
      this.httpServer = null
    }
  }
}

// Export singleton instance
export const socketServer = new SocketIOServer()