import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WRKS Studio",
  description: "Voice-first AI agent for small business.",
  metadataBase: new URL("https://app.slightwrks.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#a78bfa",
          colorBackground: "#08080a",
          colorInputBackground: "rgba(255,255,255,0.03)",
          colorInputText: "#f5f5f5",
          colorText: "#f5f5f5",
          colorTextSecondary: "#a3a3a3",
          colorNeutral: "#f5f5f5",
          fontFamily: "var(--font-geist-sans)",
          borderRadius: "10px",
        },
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-canvas text-ink">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
