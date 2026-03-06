import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealMind - AI Mental Health Companion",
  description:
    "Your compassionate AI companion for mental health support. Track moods, journal your thoughts, practice healing exercises, and chat with an empathetic AI therapist.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
