import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamRank",
  description: "Plataforma de streaming com placar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="streamrank">
      <body className="min-h-screen bg-base-100 text-base-content">
        {children}
      </body>
    </html>
  );
}
