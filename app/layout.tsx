import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stem & Tafel — Voice dashboard",
  description: "Manage orders, reservations, and voice agent calls.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
