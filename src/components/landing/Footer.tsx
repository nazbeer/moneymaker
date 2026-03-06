import Link from "next/link";
import { Brain, Heart } from "lucide-react";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      {/* Crisis resources banner */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
            <Heart className="w-5 h-5 text-pink-300 flex-shrink-0" />
            <p className="text-sm text-purple-100">
              <strong className="text-white">
                If you&apos;re in crisis, please reach out:
              </strong>{" "}
              Call or text{" "}
              <a
                href="tel:988"
                className="text-white underline underline-offset-2 font-semibold hover:text-purple-200 transition-colors"
              >
                988
              </a>{" "}
              (Suicide &amp; Crisis Lifeline) or text{" "}
              <strong className="text-white">HOME</strong> to{" "}
              <a
                href="sms:741741"
                className="text-white underline underline-offset-2 font-semibold hover:text-purple-200 transition-colors"
              >
                741741
              </a>{" "}
              (Crisis Text Line). Help is available 24/7.
            </p>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">HealMind</span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs text-center md:text-left">
              Your compassionate AI companion for mental health support and
              emotional healing.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} HealMind. All rights reserved.
            </p>
            <p className="text-xs text-gray-600">
              HealMind is not a substitute for professional mental health care.
              If you need immediate help, please contact a mental health
              professional or call 988.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
