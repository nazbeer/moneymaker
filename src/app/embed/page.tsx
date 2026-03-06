"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, Heart, Code, Zap, Shield } from "lucide-react";

export default function EmbedPage() {
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const embedScript = `<script src="https://healmind.app/widget.js" data-api-key="YOUR_API_KEY"></script>`;

  const embedReact = `import { HealMindWidget } from '@healmind/react';

function App() {
  return (
    <HealMindWidget
      apiKey="YOUR_API_KEY"
      theme="light"
      position="bottom-right"
    />
  );
}`;

  const embedIframe = `<iframe
  src="https://healmind.app/embed/chat?key=YOUR_API_KEY"
  width="400"
  height="600"
  frameborder="0"
  allow="microphone"
></iframe>`;

  const restApi = `curl -X POST https://api.healmind.app/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "I am feeling anxious today"}'`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const snippets = [
    {
      id: "script",
      title: "Script Tag",
      description: "Drop this into any HTML page to add the chat widget.",
      code: embedScript,
      language: "html",
    },
    {
      id: "react",
      title: "React Component",
      description: "Use the React package for seamless integration.",
      code: embedReact,
      language: "jsx",
    },
    {
      id: "iframe",
      title: "iFrame Embed",
      description: "Embed the chat interface directly in any webpage.",
      code: embedIframe,
      language: "html",
    },
    {
      id: "api",
      title: "REST API",
      description: "Integrate directly with the HealMind API.",
      code: restApi,
      language: "bash",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">HealMind</span>
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:from-purple-700 hover:to-indigo-700 transition-all"
          >
            Get API Key
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Embed <span className="gradient-text">HealMind</span> Anywhere
          </h1>
          <p className="text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
            Add AI-powered mental health support to your website, app, or
            platform in minutes. Give your users access to compassionate,
            evidence-based emotional support.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <Code className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Easy Integration</h3>
            <p className="text-sm text-gray-500 mt-2">
              A single line of code to add the widget. Works with any framework
              or plain HTML.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Fast & Reliable</h3>
            <p className="text-sm text-gray-500 mt-2">
              Sub-second response times with 99.9% uptime. Your users get
              instant support when they need it.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">
              Privacy-First
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              All conversations are encrypted. HIPAA-compliant infrastructure.
              User data is never shared.
            </p>
          </div>
        </div>

        {/* Code Snippets */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Integration Options
          </h2>
          {snippets.map((snippet) => (
            <div
              key={snippet.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {snippet.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {snippet.description}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(snippet.code, snippet.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {copiedSnippet === snippet.id ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="px-6 py-4 bg-gray-950 text-gray-100 text-sm overflow-x-auto">
                <code>{snippet.code}</code>
              </pre>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-10 text-white">
          <h2 className="text-2xl font-bold">Ready to get started?</h2>
          <p className="text-purple-100 mt-2 max-w-lg mx-auto">
            Create a free account to get your API key and start integrating
            HealMind into your platform today.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-6 px-8 py-3 bg-white text-purple-700 rounded-xl font-medium hover:bg-purple-50 transition-colors"
          >
            Get Your API Key
          </Link>
        </div>
      </main>
    </div>
  );
}
