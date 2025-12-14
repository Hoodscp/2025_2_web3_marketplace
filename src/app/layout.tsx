import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "../context/Web3Context";
import Navbar from "../components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NFT Marketplace",
  description: "Buy, Sell, and Mint NFTs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <Web3Provider>
          <Navbar />
          <main className="min-h-[calc(100vh-80px)]">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}
