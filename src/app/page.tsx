"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useWeb3 } from "../context/Web3Context";
import { ethers } from "ethers";

export default function Home() {
  const { contracts, account } = useWeb3();
  const [loading, setLoading] = useState(false);

  const claimTokens = async () => {
    if (!contracts.paymentToken || !account) return;

    try {
      setLoading(true);
      const tx = await contracts.paymentToken.claimTokens();
      await tx.wait();
      alert("Tokens claimed successfully!");
    } catch (error: any) {
      console.error(error);
      alert(error.reason || "Failed to claim tokens");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl"
      >
        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Discover Rare Digital Art
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 mb-12">
          The world's most premium marketplace for unique NFTs.
          <br />
          Claim your free tokens and start collecting today.
        </p>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <button
            onClick={claimTokens}
            disabled={loading || !account}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Claiming..." : "Claim 1000 MKT Tokens"}
          </button>

          <a
            href="/marketplace"
            className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-lg transition-all hover:scale-105"
          >
            Explore Marketplace
          </a>
        </div>

        {!account && (
          <p className="mt-4 text-sm text-gray-500">
            Connect your wallet to claim tokens
          </p>
        )}
      </motion.div>

      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
