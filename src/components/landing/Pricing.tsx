"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles } from "lucide-react";
import { PREMIUM_PRICE } from "@/lib/constants";

const freeTier = {
  name: "Free",
  price: "0",
  description: "Get started on your healing journey",
  features: [
    "5 AI chat messages per day",
    "Basic mood tracking",
    "3 healing exercises",
    "Community access",
    "Daily affirmations",
  ],
  cta: "Start Free",
  href: "/auth/signin",
};

const premiumTier = {
  name: "Premium",
  price: PREMIUM_PRICE.toFixed(2),
  description: "Unlock your full healing potential",
  features: [
    "Unlimited AI chat messages",
    "Advanced mood analytics",
    "All healing exercises",
    "Priority community features",
    "Daily affirmations",
    "Journal with AI prompts",
    "Export your data",
    "Early access to new features",
  ],
  cta: "Upgrade to Premium",
  href: "/pricing",
};

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
            Simple pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Start Healing Today
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Begin for free, upgrade when you&apos;re ready. Your mental health
            is worth investing in.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free tier */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col"
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {freeTier.name}
              </h3>
              <p className="text-sm text-gray-500">{freeTier.description}</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">
                ${freeTier.price}
              </span>
              <span className="text-gray-500 ml-1">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {freeTier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href={freeTier.href}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-purple-200 text-purple-700 font-semibold text-sm hover:bg-purple-50 hover:border-purple-300 transition-all"
            >
              {freeTier.cta}
            </Link>
          </motion.div>

          {/* Premium tier */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative bg-white rounded-2xl p-8 flex flex-col"
            style={{
              border: "2px solid transparent",
              backgroundClip: "padding-box",
            }}
          >
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 -z-10" />
            <div className="absolute inset-[2px] rounded-[14px] bg-white -z-10" />

            {/* Popular badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold shadow-lg">
                <Sparkles className="w-3.5 h-3.5" />
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {premiumTier.name}
                </h3>
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-sm text-gray-500">
                {premiumTier.description}
              </p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">
                ${premiumTier.price}
              </span>
              <span className="text-gray-500 ml-1">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {premiumTier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href={premiumTier.href}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md shadow-purple-200 hover:shadow-lg"
            >
              {premiumTier.cta}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
