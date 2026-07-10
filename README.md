# AURUM VPN Management Panel

A professional VPN control panel for managing a WireGuard VPN server. Built with Next.js 16, TypeScript, Tailwind CSS v4, and Prisma.

## Quick Start (Demo Mode)

```bash
# Install dependencies
npm install

# Initialize the database
npx prisma generate
npx prisma migrate dev --name init

# Start in demo mode
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs in demo mode by default with mock data.

## Production Mode (Ubuntu/Linux VPS)

### 1. Install WireGuard

```bash
sudo apt update
sudo apt install wireguard wireguard-tools

# Enable IP forwarding
echo "net.ipv4.ip_forward = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Generate server keys
wg genkey | sudo tee /etc/wireguard/server_private.key
sudo wg pubkey < /etc/wireguard/server_private.key | sudo tee /etc/wireguard/server_public.key
sudo chmod 600 /etc/wireguard/server_private.key
```

### 2. Configure WireGuard

Create `/etc/wireguard/wg0.conf`:

```ini
[Interface]
PrivateKey = <server_private_key>
Address = 10.8.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
```

```bash
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
```

### 3. Open Firewall Ports

```bash
sudo ufw allow 51820/udp
sudo ufw allow 3000/tcp
sudo ufw reload
```

### 4. Configure Environment

```bash
cp .env .env.production
```

Edit `.env.production`:

```env
VPN_MODE=production
DATABASE_URL=file:./data/prod.db
ADMIN_PASSWORD=your-secure-password
WG_INTERFACE=wg0
WG_ENDPOINT_HOST=your-server-ip
WG_PORT=51820
WG_SUBNET=10.8.0.0/24
WG_DNS=1.1.1.1
```

### 5. Build and Run

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

Or with Docker:

```bash
docker compose up -d
```

## Adding a VPN Client

1. Open the dashboard at `/devices`
2. Click "Add Device"
3. Enter a name and select the platform
4. Click "Create"
5. Click the actions menu on the new device
6. Select "QR Code" to scan with WireGuard mobile app, or "Download Config" for desktop

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VPN_MODE` | `demo` | `demo` or `production` |
| `DATABASE_URL` | `file:./dev.db` | SQLite database path |
| `ADMIN_PASSWORD` | `aurum-admin-2024` | Admin panel password |
| `WG_INTERFACE` | `wg0` | WireGuard interface name |
| `WG_ENDPOINT_HOST` | `vpn.example.com` | Server public hostname/IP |
| `WG_PORT` | `51820` | WireGuard listening port |
| `WG_SUBNET` | `10.8.0.0/24` | VPN subnet |
| `WG_DNS` | `1.1.1.1` | DNS server |
| `WG_ALLOWED_IPS` | `0.0.0.0/0,::/0` | Default allowed IPs |

## Architecture

```
src/
  app/               # Next.js App Router pages and API routes
    overview/         # Dashboard overview
    devices/          # Device management
    configs/          # VPN configuration files
    server/           # Server status
    activity/         # Activity logs
    regions/          # Server regions
    security/         # Security settings
    premium/          # Premium plan management
    settings/         # App settings
    admin/            # Admin panel
    api/              # REST API routes
  components/
    ui/               # Reusable UI components
    layout/           # App shell, sidebar, topbar
  lib/
    wireguard/        # WireGuard service layer
      service.ts      # Main service (dispatches to demo/production)
      commands.ts     # Production WireGuard commands (safe, whitelisted)
      demo.ts         # Demo mode mock data
      clientConfig.ts # Client config generation + QR codes
      parser.ts       # Config builder
    utils.ts          # Utility functions
    storage.ts        # In-memory data store
    demoData.ts       # Demo data generators
    planLimits.ts     # Free/Premium feature limits
    security.ts       # Security utilities
  stores/
    appStore.ts       # Zustand client state
  types/
    index.ts          # TypeScript types
prisma/
  schema.prisma       # Database schema
```

## What is Real vs. Mocked

### Real
- Complete UI with all pages and navigation
- Device CRUD operations (create, rename, enable/disable, delete)
- WireGuard client config generation (valid `.conf` format)
- QR code generation for mobile WireGuard apps
- In-memory data store with persistence layer
- Plan-based feature gating (Free vs Premium)
- Admin password protection
- Activity logging
- Settings management
- Responsive design with dark mode

### Mocked (Demo Mode)
- Server status (always shows online)
- WireGuard interface operations (no real commands executed)
- Traffic usage data (randomly generated)
- Connection handshakes (simulated timestamps)
- Key generation (random, not cryptographically secure in demo)
- Region availability (placeholder cards)

### Production Mode
- Calls real WireGuard commands via whitelisted `execSync`
- Command whitelist prevents arbitrary shell injection
- Private keys are generated randomly (consider using `wg genkey` for production)
- Real interface status checking
- Real peer management

## Before Public Launch

1. **Replace demo key generation** with `wg genkey` / `wg pubkey` for real WireGuard keys
2. **Add real authentication** (JWT sessions, not just password gate)
3. **Add rate limiting** on API routes
4. **Add HTTPS** (reverse proxy with nginx/Caddy)
5. **Use a proper database** (PostgreSQL) for production
6. **Add input sanitization** audit
7. **Add CSP headers**
8. **Add proper error logging** (Sentry, etc.)
9. **Add database backups**
10. **Add CSRF protection**
11. **Encrypt private keys at rest**
12. **Add audit logging for all admin actions**

## License

Private use only.
