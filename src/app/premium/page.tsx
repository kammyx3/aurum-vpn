"use client";

import {
  Crown,
  Check,
  Lock,
  Zap,
  Globe,
  Key,
  FileText,
  Users,
  BarChart3,
  StickyNote,
  ClipboardList,
  Download,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useAppStore } from "@/stores/appStore";
import { PREMIUM_FEATURES, PREMIUM_PRICE, PREMIUM_PRICE_ANNUAL } from "@/lib/planLimits";

export default function PremiumPage() {
  const { addToast } = useToast();
  const plan = useAppStore((s) => s.plan);
  const vpnMode = useAppStore((s) => s.vpnMode);

  const handleUpgrade = () => {
    addToast({
      title: "Payment integration coming soon!",
      description: "This feature is not yet available in demo mode.",
      variant: "default",
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#c8a54e]/10 px-4 py-1.5 mb-4">
          <Crown className="h-4 w-4 text-[#c8a54e]" />
          <span className="text-xs font-medium text-[#c8a54e]">AURUM Premium</span>
        </div>
        <h1 className="text-2xl font-bold">
          {plan === "premium" ? "You're Premium" : "Upgrade to Premium"}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
          {plan === "premium"
            ? "Thank you for being a Premium member. Enjoy all features unlocked."
            : "Unlock the full power of AURUM VPN with Premium features."}
        </p>
        {vpnMode === "demo" && (
          <Badge variant="premium" className="mt-3">
            Demo Mode
          </Badge>
        )}
      </div>

      {plan === "premium" ? (
        <Card className="max-w-2xl mx-auto border-[#c8a54e]/30">
          <CardContent className="p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c8a54e]/10 mx-auto mb-4">
              <Crown className="h-8 w-8 text-[#c8a54e]" />
            </div>
            <h2 className="text-lg font-semibold">Premium Active</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              You have access to all premium features.
            </p>
            <div className="grid grid-cols-2 gap-3 text-left">
              {PREMIUM_FEATURES.map((f) => (
                <div key={f.key} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <Check className="h-4 w-4 text-[#c8a54e] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Card className="relative">
              <CardContent className="p-6">
                <p className="text-xs text-muted-foreground mb-1">Monthly</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${PREMIUM_PRICE}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Billed monthly
                </p>
                <Button className="w-full" onClick={handleUpgrade}>
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Monthly
                </Button>
              </CardContent>
            </Card>

            <Card className="relative border-[#c8a54e]/50">
              <div className="absolute -top-2.5 right-4">
                <Badge variant="premium" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Best Value
                </Badge>
              </div>
              <CardContent className="p-6">
                <p className="text-xs text-muted-foreground mb-1">Annual</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${PREMIUM_PRICE_ANNUAL}</span>
                  <span className="text-sm text-muted-foreground">/yr</span>
                </div>
                <p className="text-xs text-emerald-500 mt-1 mb-4">
                  Save 17% vs monthly
                </p>
                <Button
                  className="w-full bg-[#c8a54e] hover:bg-[#c8a54e]/90 text-black"
                  onClick={handleUpgrade}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Annual
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-sm">Premium Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Zap, text: "Unlimited devices" },
                  { icon: Globe, text: "All server regions" },
                  { icon: BarChart3, text: "Advanced analytics" },
                  { icon: Globe, text: "Custom DNS resolvers" },
                  { icon: Key, text: "Key rotation reminders" },
                  { icon: FileText, text: "Branded configs" },
                  { icon: StickyNote, text: "Device notes & labels" },
                  { icon: ClipboardList, text: "Full audit log" },
                  { icon: Users, text: "Team device management" },
                  { icon: Download, text: "CSV data export" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4 text-[#c8a54e] shrink-0" />
                    <span className="text-xs">{item.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-sm">Feature Comparison</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                <div className="grid grid-cols-3 px-4 py-2 text-xs font-medium text-muted-foreground">
                  <span>Feature</span>
                  <span className="text-center">Free</span>
                  <span className="text-center">Premium</span>
                </div>
                {PREMIUM_FEATURES.map((f) => (
                  <div key={f.key} className="grid grid-cols-3 px-4 py-2.5 items-center">
                    <div>
                      <p className="text-xs font-medium">{f.label}</p>
                    </div>
                    <div className="flex justify-center">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                    <div className="flex justify-center">
                      <Check className="h-3.5 w-3.5 text-[#c8a54e]" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
