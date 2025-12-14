"use client";

import Link from "next/link";
import { useWeb3 } from "../context/Web3Context";

export default function Navbar() {
    const { account, connectWallet } = useWeb3();

    return (
        <nav className="flex items-center justify-between px-8 py-4 bg-black/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
            <div className="flex items-center gap-8">
                <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                    NFT Market
                </Link>
                <div className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
                    <Link href="/" className="hover:text-white transition-colors">Home</Link>
                    <Link href="/mint" className="hover:text-white transition-colors">Mint NFT</Link>
                    <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
                    <Link href="/dashboard" className="hover:text-white transition-colors">My Dashboard</Link>
                </div>
            </div>

            <button
                onClick={connectWallet}
                className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all font-medium text-sm text-white"
            >
                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
            </button>
        </nav>
    );
}
