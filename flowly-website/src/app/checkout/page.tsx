"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@supabase/auth-helpers-react";
import { useEffect, useState, Suspense } from "react";

function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const session = useSession();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [session, router]);

  const handleCheckout = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const plan = searchParams.get("plan") || "pro";
      
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: plan === "pro" ? "price_pro_monthly" : "price_basic_monthly",
          userId: session.user.id,
        }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return <div>Redirecting to login...</div>;
  }

  const plan = searchParams.get("plan") || "pro";

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-md">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-center mb-6">
            Complete Your Purchase
          </h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">
              {plan === "pro" ? "Pro Plan" : "Basic Plan"}
            </h2>
            <p className="text-gray-600 mb-4">
              {plan === "pro" 
                ? "Advanced features, unlimited tasks, AI assistance" 
                : "Essential features for personal productivity"
              }
            </p>
            <div className="text-2xl font-bold">
              €{plan === "pro" ? "7.00" : "4.99"}/month
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-[#22c55e] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#16a34a] disabled:opacity-50"
          >
            {loading ? "Processing..." : "Subscribe Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading checkout...</div>}>
      <CheckoutForm />
    </Suspense>
  );
} 