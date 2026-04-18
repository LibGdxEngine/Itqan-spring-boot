import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Success",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
