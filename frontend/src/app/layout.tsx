import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Assuming this is correct setup for Geist
import { cn } from "@/lib/utils"; // Import the cn utility
import "./globals.css";

const geistSans = Geist({ // Assuming this is correct setup for Geist
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({ // Assuming this is correct setup for Geist
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Audio Watermarker", // Optional: Add a title
  description: "Embed and detect audio watermarks", // Optional: Add a description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Add suppressHydrationWarning to html tag
    <html lang="en" suppressHydrationWarning>
      <body
        // Use cn to merge classes and ADD the 'dark' class
        className={cn(
          "min-h-screen bg-background font-sans antialiased", // Base classes
          geistSans.variable, // Font variable
          geistMono.variable, // Font variable
          "dark" // Apply dark mode class
        )}
      >
        {children}
      </body>
    </html>
  );
}