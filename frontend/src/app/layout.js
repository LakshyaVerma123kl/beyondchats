import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "BeyondChats - AI Article Manager",
  description:
    "Intelligent article scraping and AI-powered content enhancement platform",
  keywords: ["AI", "articles", "content", "automation", "web scraping"],
  authors: [{ name: "BeyondChats" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
