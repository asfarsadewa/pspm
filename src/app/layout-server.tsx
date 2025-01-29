import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pilih Sendiri Petualanganmu",
  description: "A choose your own adventure game powered by AI",
};

export default function RootLayoutServer({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 