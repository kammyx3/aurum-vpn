import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const plans = [
    { name: "Free", slug: "free", priceMonthly: 0, priceYearly: 0, maxDevices: 1, allowedRegions: '["us","ca"]', allowedNodeTiers: '["free"]', bandwidthLimitGb: 50, priorityLevel: 0, features: '{"vpn":true,"streaming":false,"multiHop":false,"dedicatedIp":false}', sortOrder: 0 },
    { name: "Basic", slug: "basic", priceMonthly: 499, priceYearly: 4999, maxDevices: 3, allowedRegions: '["us","ca","uk","nl","de","fr"]', allowedNodeTiers: '["free","basic"]', bandwidthLimitGb: 500, priorityLevel: 1, features: '{"vpn":true,"streaming":false,"multiHop":false,"dedicatedIp":false}', sortOrder: 1 },
    { name: "Plus", slug: "plus", priceMonthly: 999, priceYearly: 9999, maxDevices: 5, allowedRegions: '["us","ca","uk","nl","de","fr","es","pl","se","sg","jp","kr","au","br","mx"]', allowedNodeTiers: '["free","basic","plus"]', bandwidthLimitGb: 2000, priorityLevel: 2, features: '{"vpn":true,"streaming":true,"multiHop":false,"dedicatedIp":false}', sortOrder: 2 },
    { name: "Pro", slug: "pro", priceMonthly: 1499, priceYearly: 14999, maxDevices: 10, allowedRegions: '["us","ca","uk","nl","de","fr","es","pl","se","sg","jp","kr","au","br","mx"]', allowedNodeTiers: '["free","basic","plus","pro"]', bandwidthLimitGb: 0, priorityLevel: 3, features: '{"vpn":true,"streaming":true,"multiHop":true,"dedicatedIp":false}', sortOrder: 3 },
    { name: "Business", slug: "business", priceMonthly: 2999, priceYearly: 29999, maxDevices: 25, allowedRegions: '["us","ca","uk","nl","de","fr","es","pl","se","sg","jp","kr","au","br","mx"]', allowedNodeTiers: '["free","basic","plus","pro","business"]', bandwidthLimitGb: 0, priorityLevel: 4, features: '{"vpn":true,"streaming":true,"multiHop":true,"dedicatedIp":true,"team":true}', sortOrder: 4 },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({ where: { slug: plan.slug }, update: plan, create: plan });
  }

  const perks = [
    { name: "Extra Device Slot", slug: "extra-device", description: "Add one more device to your account", priceMonthly: 199, type: "addon", metadata: '{"type":"device_slot","count":1}' },
    { name: "Dedicated IP", slug: "dedicated-ip", description: "Get your own static IP address", priceMonthly: 499, type: "addon", metadata: '{"type":"dedicated_ip"}' },
    { name: "Streaming Access", slug: "streaming", description: "Unlock streaming-optimized nodes", priceMonthly: 299, type: "addon", metadata: '{"type":"feature","grants":["streaming"]}' },
    { name: "Gaming Routing", slug: "gaming", description: "Low-latency routing optimized for gaming", priceMonthly: 399, type: "addon", metadata: '{"type":"feature","grants":["low_latency"]}' },
    { name: "Multi-Hop", slug: "multi-hop", description: "Route through multiple nodes for extra privacy", priceMonthly: 299, type: "addon", metadata: '{"type":"feature","grants":["multi_hop"]}' },
    { name: "Premium Regions", slug: "premium-regions", description: "Access to premium server locations", priceMonthly: 199, type: "addon", metadata: '{"type":"region_access","regions":["premium"]}' },
    { name: "Extra Bandwidth 100GB", slug: "extra-bandwidth", description: "Add 100GB of data transfer", priceMonthly: 99, type: "addon", metadata: '{"type":"bandwidth","gb":100}' },
    { name: "Priority Support", slug: "priority-support", description: "24/7 priority customer support", priceMonthly: 499, type: "service", metadata: '{"type":"support","level":"priority"}' },
  ];

  for (const perk of perks) {
    await prisma.perk.upsert({ where: { slug: perk.slug }, update: perk, create: perk });
  }

  const nodes = [
    { name: "New York-01", city: "New York", country: "United States", countryCode: "US", region: "us-east", latitude: 40.7128, longitude: -74.006, tier: "free", requiredPlanSlug: "free", status: "online", loadPercent: 45, tags: '["low-latency","streaming"]', protocols: '["wireguard"]' },
    { name: "New York-02", city: "New York", country: "United States", countryCode: "US", region: "us-east", latitude: 40.7589, longitude: -73.9851, tier: "plus", requiredPlanSlug: "plus", status: "online", loadPercent: 30, tags: '["low-latency","streaming","gaming"]', protocols: '["wireguard"]' },
    { name: "Dallas-01", city: "Dallas", country: "United States", countryCode: "US", region: "us-central", latitude: 32.7767, longitude: -96.797, tier: "free", requiredPlanSlug: "free", status: "online", loadPercent: 55, tags: '["low-latency"]', protocols: '["wireguard"]' },
    { name: "Dallas-02", city: "Dallas", country: "United States", countryCode: "US", region: "us-central", latitude: 32.85, longitude: -96.85, tier: "basic", requiredPlanSlug: "basic", status: "high_load", loadPercent: 82, tags: '["low-latency"]', protocols: '["wireguard"]' },
    { name: "Los Angeles-01", city: "Los Angeles", country: "United States", countryCode: "US", region: "us-west", latitude: 34.0522, longitude: -118.2437, tier: "free", requiredPlanSlug: "free", status: "online", loadPercent: 40, tags: '["low-latency","streaming"]', protocols: '["wireguard"]' },
    { name: "Los Angeles-02", city: "Los Angeles", country: "United States", countryCode: "US", region: "us-west", latitude: 34.1, longitude: -118.3, tier: "pro", requiredPlanSlug: "pro", status: "online", loadPercent: 20, tags: '["low-latency","streaming","gaming","premium"]', protocols: '["wireguard"]' },
    { name: "Miami-01", city: "Miami", country: "United States", countryCode: "US", region: "us-south", latitude: 25.7617, longitude: -80.1918, tier: "basic", requiredPlanSlug: "basic", status: "online", loadPercent: 35, tags: '["streaming","low-latency"]', protocols: '["wireguard"]' },
    { name: "Chicago-01", city: "Chicago", country: "United States", countryCode: "US", region: "us-central", latitude: 41.8781, longitude: -87.6298, tier: "free", requiredPlanSlug: "free", status: "maintenance", loadPercent: 0, tags: '["low-latency"]', protocols: '["wireguard"]' },
    { name: "Toronto-01", city: "Toronto", country: "Canada", countryCode: "CA", region: "ca-east", latitude: 43.6532, longitude: -79.3832, tier: "free", requiredPlanSlug: "free", status: "online", loadPercent: 25, tags: '["low-latency"]', protocols: '["wireguard"]' },
    { name: "London-01", city: "London", country: "United Kingdom", countryCode: "GB", region: "eu-west", latitude: 51.5074, longitude: -0.1278, tier: "free", requiredPlanSlug: "free", status: "online", loadPercent: 50, tags: '["low-latency","streaming"]', protocols: '["wireguard"]' },
    { name: "London-02", city: "London", country: "United Kingdom", countryCode: "GB", region: "eu-west", latitude: 51.5, longitude: -0.1, tier: "plus", requiredPlanSlug: "plus", status: "online", loadPercent: 28, tags: '["low-latency","streaming","gaming"]', protocols: '["wireguard"]' },
    { name: "Amsterdam-01", city: "Amsterdam", country: "Netherlands", countryCode: "NL", region: "eu-central", latitude: 52.3676, longitude: 4.9041, tier: "free", requiredPlanSlug: "free", status: "online", loadPercent: 38, tags: '["low-latency","privacy"]', protocols: '["wireguard"]' },
    { name: "Amsterdam-02", city: "Amsterdam", country: "Netherlands", countryCode: "NL", region: "eu-central", latitude: 52.35, longitude: 4.9, tier: "pro", requiredPlanSlug: "pro", status: "online", loadPercent: 15, tags: '["low-latency","privacy","premium"]', protocols: '["wireguard"]' },
    { name: "Frankfurt-01", city: "Frankfurt", country: "Germany", countryCode: "DE", region: "eu-central", latitude: 50.1109, longitude: 8.6821, tier: "basic", requiredPlanSlug: "basic", status: "online", loadPercent: 42, tags: '["low-latency","privacy"]', protocols: '["wireguard"]' },
    { name: "Paris-01", city: "Paris", country: "France", countryCode: "FR", region: "eu-west", latitude: 48.8566, longitude: 2.3522, tier: "basic", requiredPlanSlug: "basic", status: "online", loadPercent: 33, tags: '["low-latency","streaming"]', protocols: '["wireguard"]' },
    { name: "Madrid-01", city: "Madrid", country: "Spain", countryCode: "ES", region: "eu-south", latitude: 40.4168, longitude: -3.7038, tier: "plus", requiredPlanSlug: "plus", status: "online", loadPercent: 20, tags: '["low-latency"]', protocols: '["wireguard"]' },
    { name: "Warsaw-01", city: "Warsaw", country: "Poland", countryCode: "PL", region: "eu-east", latitude: 52.2297, longitude: 21.0122, tier: "plus", requiredPlanSlug: "plus", status: "online", loadPercent: 18, tags: '["low-latency","privacy"]', protocols: '["wireguard"]' },
    { name: "Stockholm-01", city: "Stockholm", country: "Sweden", countryCode: "SE", region: "eu-north", latitude: 59.3293, longitude: 18.0686, tier: "pro", requiredPlanSlug: "pro", status: "online", loadPercent: 12, tags: '["low-latency","privacy","premium"]', protocols: '["wireguard"]' },
    { name: "Singapore-01", city: "Singapore", country: "Singapore", countryCode: "SG", region: "ap-southeast", latitude: 1.3521, longitude: 103.8198, tier: "basic", requiredPlanSlug: "basic", status: "online", loadPercent: 60, tags: '["low-latency"]', protocols: '["wireguard"]' },
    { name: "Tokyo-01", city: "Tokyo", country: "Japan", countryCode: "JP", region: "ap-east", latitude: 35.6762, longitude: 139.6503, tier: "basic", requiredPlanSlug: "basic", status: "online", loadPercent: 44, tags: '["low-latency","streaming"]', protocols: '["wireguard"]' },
    { name: "Tokyo-02", city: "Tokyo", country: "Japan", countryCode: "JP", region: "ap-east", latitude: 35.68, longitude: 139.69, tier: "pro", requiredPlanSlug: "pro", status: "online", loadPercent: 10, tags: '["low-latency","streaming","gaming","premium"]', protocols: '["wireguard"]' },
    { name: "Seoul-01", city: "Seoul", country: "South Korea", countryCode: "KR", region: "ap-east", latitude: 37.5665, longitude: 126.978, tier: "plus", requiredPlanSlug: "plus", status: "online", loadPercent: 22, tags: '["low-latency","gaming"]', protocols: '["wireguard"]' },
    { name: "Sydney-01", city: "Sydney", country: "Australia", countryCode: "AU", region: "ap-south", latitude: -33.8688, longitude: 151.2093, tier: "basic", requiredPlanSlug: "basic", status: "online", loadPercent: 30, tags: '["low-latency"]', protocols: '["wireguard"]' },
    { name: "Sao Paulo-01", city: "Sao Paulo", country: "Brazil", countryCode: "BR", region: "sa-east", latitude: -23.5505, longitude: -46.6333, tier: "plus", requiredPlanSlug: "plus", status: "online", loadPercent: 35, tags: '["low-latency"]', protocols: '["wireguard"]' },
    { name: "Mexico City-01", city: "Mexico City", country: "Mexico", countryCode: "MX", region: "na-central", latitude: 19.4326, longitude: -99.1332, tier: "basic", requiredPlanSlug: "basic", status: "online", loadPercent: 28, tags: '["low-latency"]', protocols: '["wireguard"]' },
  ];

  for (const node of nodes) {
    await prisma.vpnNode.upsert({
      where: { id: `seed-${node.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}` },
      update: node,
      create: { id: `seed-${node.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`, ...node, endpointHost: `${node.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.aurum-vpn.net`, publicKey: "", maxUsers: 100, currentUsers: 0 },
    });
  }

  console.log("Seed complete: plans, perks, and nodes created");
}

main().catch((e) => { console.error(e); process.exit(1); });
