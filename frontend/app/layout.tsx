import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Gateway Visualizer",
  description: "Interactive animated admin dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
