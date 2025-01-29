"use client";

import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { NumberAuth } from "@/components/number-auth";
import RootLayoutServer from "./layout-server";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const authed = localStorage.getItem("number-authed");
    if (authed) setIsAuthed(true);
  }, []);

  const handleAuthComplete = () => {
    setIsAuthed(true);
    localStorage.setItem("number-authed", "true");
  };

  if (!mounted) return null;

  return (
    <RootLayoutServer>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {!isAuthed ? (
              <NumberAuth onComplete={handleAuthComplete} />
            ) : (
              children
            )}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </RootLayoutServer>
  );
}
