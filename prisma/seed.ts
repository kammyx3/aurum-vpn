import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcryptjs from "bcryptjs";

const url = process.env.DATABASE_URL || "file:./prisma/dev.db";
const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter });

function randomKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let key = "";
  for (let i = 0; i < 44; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key + "=";
}

function pastDate(days: number, hours = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d;
}

async function main() {
  const existingUser = await prisma.user.findFirst();
  if (existingUser) {
    console.log("Database already seeded, skipping.");
    return;
  }

  console.log("Seeding database...");

  const adminPassword = await bcryptjs.hash(
    process.env.ADMIN_PASSWORD || "aurum-admin-2024",
    12
  );

  await prisma.user.create({
    data: {
      username: "admin",
      password: adminPassword,
      plan: "premium",
    },
  });

  const server = await prisma.vpnServer.create({
    data: {
      name: "AURUM VPN Server",
      mode: process.env.VPN_MODE || "demo",
      interfaceName: process.env.WG_INTERFACE || "wg0",
      endpointHost: process.env.WG_ENDPOINT_HOST || "vpn.example.com",
      listenPort: parseInt(process.env.WG_PORT || "51820"),
      subnet: process.env.WG_SUBNET || "10.8.0.0/24",
      dns: process.env.WG_DNS || "1.1.1.1",
      mtu: 1420,
      publicKey: "",
      status: "online",
      region: "us-east-1",
    },
  });

  const devices = [
    {
      name: "MacBook Pro",
      platform: "macos",
      publicKey: randomKey(),
      privateKey: randomKey(),
      presharedKey: randomKey(),
      assignedIp: "10.8.0.2",
      enabled: true,
      notes: "Primary work laptop",
      planRequired: "free",
      vpnServerId: server.id,
      lastHandshake: pastDate(0, 2),
      uploadBytes: BigInt(2_147_483_648),
      downloadBytes: BigInt(8_589_934_592),
    },
    {
      name: "iPhone 15 Pro",
      platform: "ios",
      publicKey: randomKey(),
      privateKey: randomKey(),
      presharedKey: randomKey(),
      assignedIp: "10.8.0.3",
      enabled: true,
      notes: "",
      planRequired: "free",
      vpnServerId: server.id,
      lastHandshake: pastDate(0, 5),
      uploadBytes: BigInt(524_288_000),
      downloadBytes: BigInt(1_073_741_824),
    },
    {
      name: "Windows Desktop",
      platform: "windows",
      publicKey: randomKey(),
      privateKey: randomKey(),
      presharedKey: randomKey(),
      assignedIp: "10.8.0.4",
      enabled: false,
      notes: "Old desktop - rarely used",
      planRequired: "premium",
      vpnServerId: server.id,
      lastHandshake: pastDate(14),
      uploadBytes: BigInt(107_374_182),
      downloadBytes: BigInt(429_496_729),
    },
    {
      name: "Android Pixel",
      platform: "android",
      publicKey: randomKey(),
      privateKey: randomKey(),
      presharedKey: randomKey(),
      assignedIp: "10.8.0.5",
      enabled: true,
      notes: "Testing device",
      planRequired: "free",
      vpnServerId: server.id,
      lastHandshake: pastDate(0, 1),
      uploadBytes: BigInt(1_073_741_824),
      downloadBytes: BigInt(2_147_483_648),
    },
  ];

  const createdDevices = [];
  for (const d of devices) {
    const created = await prisma.device.create({ data: d });
    createdDevices.push(created);
  }

  const types = ["connected", "disconnected", "config_downloaded", "key_rotated", "device_created"];
  for (let i = 0; i < 30; i++) {
    const device = createdDevices[i % createdDevices.length];
    const type = types[i % types.length];
    let message = "";
    switch (type) {
      case "connected":
        message = `${device.name} connected to VPN`;
        break;
      case "disconnected":
        message = `${device.name} disconnected from VPN`;
        break;
      case "config_downloaded":
        message = `Configuration downloaded for ${device.name}`;
        break;
      case "key_rotated":
        message = `Keys rotated for ${device.name}`;
        break;
      case "device_created":
        message = `Device "${device.name}" was registered`;
        break;
    }
    await prisma.activityLog.create({
      data: {
        deviceId: device.id,
        type,
        message,
        metadata: "{}",
        createdAt: pastDate(Math.floor(i / 3), i % 24),
      },
    });
  }

  await prisma.appSettings.create({
    data: { id: "singleton", theme: "system", plan: "free", data: "{}" },
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
