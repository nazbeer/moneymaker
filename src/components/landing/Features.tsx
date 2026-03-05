"use client";

import { motion } from "framer-motion";
import {
  MessageCircle,
  BarChart3,
  Sparkles,
  Users,
  Sun,
  Compass,
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "AI Chat Companion",
    description:
      "Talk to a compassionate AI that listens without judgment, validates your feelings, and offers evidence-based coping strategies.",
    color: "from-purple-500 to-indigo-500",
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    icon: BarChart3,
    title: "Mood Tracking",
    description:
      "Track your emotional patterns over time with beautiful charts. Understand your triggers and celebrate your progress.",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: Sparkles,
    title: "Healing Exercises",
    description:
      "Guided breathing, meditation, CBT thought records, and gratitude exercises designed to support your healing journey.",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: Users,
    title: "Community Support",
    description:
      "Connect with others who understand. Share anonymously, offer support, and know that you are never alone in this.",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: Sun,
    title: "Daily Affirmations",
    description:
      "Start each day with personalized affirmations that remind you of your strength, worth, and capacity to heal.",
    color: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  {
    icon: Compass,
    title: "Healing Journey",
    description:
      "Track your streaks, set goals, and see how far you have come. Your healing is not linear, but every step counts.",
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-100",
    iconColor: "text-violet-600",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
            Everything you need
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Tools for Your Healing Journey
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            A comprehensive suite of features designed with care to support your
            mental health and emotional well-being.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bgColor} mb-4`}
                >
                  <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
