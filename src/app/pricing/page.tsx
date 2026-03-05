"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Check, X, Loader2, Crown, Sparkles } from "lucide-react";
import { PREMIUM_PRICE, FREE_CHAT_LIMIT } from "@/lib/constants";

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<"free" | "premium">("free");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch("/api/user/plan");
        if (res.ok) {
          const data = await res.json();
          setCurrentPlan(data.plan);
        }
      } catch (error) {
        console.error("Failed to fetch plan:", error);
      }
    }

    if (status === "authenticated") {
      fetchPlan();
    }
  }, [status]);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const freeFeatures = [
    { text: `${FREE_CHAT_LIMIT} AI chats per day`, included: true },
    { text: "Mood tracking", included: true },
    { text: "Basic exercises", included: true },
    { text: "Community access", included: true },
    { text: "Journal (3 entries/day)", included: true },
    { text: "Unlimited AI chats", included: false },
    { text: "Premium exercises (CBT, etc.)", included: false },
    { text: "Advanced mood analytics", included: false },
    { text: "Priority support", included: false },
    { text: "Export your data", included: false },
  ];

  const premiumFeatures = [
    { text: "Unlimited AI chats", included: true },
    { text: "Mood tracking", included: true },
    { text: "All exercises (including CBT)", included: true },
    { text: "Community access", included: true },
    { text: "Unlimited journal entries", included: true },
    { text: "Advanced mood analytics", included: true },
    { text: "Priority support", included: true },
    { text: "Export your data", included: true },
    { text: "Early access to new features", included: true },
    { text: "Custom healing plans", included: true },
  ];

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Choose Your Plan
          </h1>
          <p className="text-gray-500 mt-2 max-w-lg mx-auto">
            Invest in your mental health. Upgrade to Premium for unlimited
            access to all healing tools.
          </p>
          {currentPlan === "premium" && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium">
              <Crown className="w-4 h-4" />
              You&apos;re on the Premium plan
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Free</h2>
              <div className="mt-2">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500 ml-1">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Get started on your healing journey
              </p>
            </div>

            <div className="space-y-3">
              {freeFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  {feature.included ? (
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <X className="w-3 h-3 text-gray-400" />
                    </div>
                  )}
                  <span
                    className={`text-sm ${
                      feature.included ? "text-gray-700" : "text-gray-400"
                    }`}
                  >
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            {currentPlan === "free" && (
              <div className="mt-8">
                <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-medium text-sm text-center">
                  Current Plan
                </div>
              </div>
            )}
          </div>

          {/* Premium Plan */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-indigo-600" />
            <div className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      Premium
                    </h2>
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-gray-900">
                      ${PREMIUM_PRICE}
                    </span>
                    <span className="text-gray-500 ml-1">/month</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Full access to all healing tools
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {premiumFeatures.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-700">
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                {currentPlan === "premium" ? (
                  <div className="w-full py-3 rounded-xl bg-purple-100 text-purple-700 font-medium text-sm text-center">
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-sm hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-200 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Crown className="w-4 h-4" />
                        Upgrade to Premium
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
