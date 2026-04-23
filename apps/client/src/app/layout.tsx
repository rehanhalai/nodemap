import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client App",
  description: "Next.js client app in a Turborepo monorepo",
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
