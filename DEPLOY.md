# Deployment Guide

## Quick Deploy (Production)

```bash
# Build and start production server (runs on port 3001)
npm run deploy

# Or separately:
npm run build        # Build frontend to dist/
cd backend && npm run build  # Compile TypeScript
cd backend && npm start      # Start production server
```

The app will be available at `http://localhost:3001`

## Development Mode

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend && npm run dev
```

## Proxmox LXC Deployment

1. **Create LXC container** with Debian/Ubuntu
2. **Install Node.js 20+**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
3. **Transfer files** to LXC (git clone or SCP)
4. **Install dependencies**:
   ```bash
   npm install
   cd backend && npm install
   ```
5. **Build**:
   ```bash
   npm run build
   cd backend && npm run build
   ```
6. **Start server**:
   ```bash
   cd backend && npm start
   ```
7. **Access**: http://YOUR_LXC_IP:3001

## Environment Variables

Create `backend/.env`:
```env
PORT=3001
JWT_SECRET=your-secret-key
VITE_API_URL=http://localhost:3001
VITE_ADMIN_PASSWORD=your-admin-password
```

## Notes

- Uses SQL.js (file-based database) - data persists in `backend/prison_muster.sql`
- For production with multiple users, consider PostgreSQL instead
- WebSocket runs on same port (3001)
