"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@supabase/auth-helpers-react";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();

  useEffect(() => {
    const startCheckout = async () => {
      if (!session?.user?.id) return;
      const plan = searchParams.get("plan");
      // TODO: Replace with your actual Stripe Price ID for Pro
      const priceId = "price_1RQWoQCm3tjHAVHI6XaJQE7f";

      if (plan === "pro") {
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId, userId: session.user.id }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert("Failed to start checkout");
          router.push("/pricing");
        }
      } else {
        router.push("/pricing");
      }
    };
    startCheckout();
  }, [session, searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg text-[#0f172a]">Redirecting to payment...</div>
    </div>
  );
} 