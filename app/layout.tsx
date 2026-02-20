import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Figtree } from "next/font/google";
import { TRPCProvider } from "@/lib/trpc/provider";
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import "./globals.css";

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sirs - Report Dashboard",
  description: "A modern dashboard for managing and viewing reports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={figtree.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NuqsAdapter>
          <TRPCProvider>{children}</TRPCProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
