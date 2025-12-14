"use client";

import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../../context/Web3Context";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import { ShoppingCart, Loader2 } from "lucide-react";
import axios from "axios";

interface Listing {
    id: number;
    seller: string;
    nftContract: string;
    tokenId: number;
    price: string;
    rawPrice: bigint;
    name: string;
    description: string;
    image: string;
}

export default function MarketplacePage() {
    const { contracts, account } = useWeb3();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [buyingId, setBuyingId] = useState<number | null>(null);

    const fetchListings = useCallback(async () => {
        if (!contracts.marketplace || !contracts.openNFT) return;

        try {
            setLoading(true);
            // Get all ItemListed events
            // In a production app, we would use a subgraph or indexer
            // For this demo, we'll scan from block 0 (or a recent block if we knew deployment)
            // To save time/RPC calls, we might limit the range, but for now we try all.
            const filter = contracts.marketplace.filters.ItemListed();
            const events = await contracts.marketplace.queryFilter(filter);

            const activeListings: Listing[] = [];

            for (const event of events) {
                if ('args' in event) {
                    const { listingId, seller, nftContract, tokenId, price } = event.args;

                    // Check if still active
                    const listing = await contracts.marketplace.listings(listingId);
                    if (!listing.isActive) continue;

                    // Fetch NFT Metadata
                    // We assume the NFT contract is the one we know (OpenNFT)
                    // If there are multiple, we'd need to instantiate them dynamically
                    const tokenURI = await contracts.openNFT.tokenURI(tokenId);

                    let metadata = { name: `NFT #${tokenId}`, description: "No description", image: "/placeholder.png" };
                    try {
                        // Handle IPFS URLs
                        const url = tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
                        const { data } = await axios.get(url);
                        metadata = data;
                    } catch (e) {
                        console.error("Error fetching metadata", e);
                    }

                    activeListings.push({
                        id: Number(listingId),
                        seller,
                        nftContract,
                        tokenId: Number(tokenId),
                        price: ethers.formatEther(price),
                        rawPrice: price,
                        name: metadata.name,
                        description: metadata.description,
                        image: metadata.image.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/"),
                    });
                }
            }

            setListings(activeListings.reverse()); // Show newest first
        } catch (error) {
            console.error("Error fetching listings:", error);
        } finally {
            setLoading(false);
        }
    }, [contracts.marketplace, contracts.openNFT]);

    useEffect(() => {
        if (contracts.marketplace) {
            fetchListings();
        }
    }, [contracts.marketplace, fetchListings]);

    const buyNFT = async (listing: Listing) => {
        if (!contracts.paymentToken || !contracts.marketplace || !account) return;

        try {
            setBuyingId(listing.id);

            // 1. Approve Token
            const allowance = await contracts.paymentToken.allowance(account, await contracts.marketplace.getAddress());
            if (allowance < listing.rawPrice) {
                const approveTx = await contracts.paymentToken.approve(await contracts.marketplace.getAddress(), listing.rawPrice);
                await approveTx.wait();
            }

            // 2. Buy NFT
            const buyTx = await contracts.marketplace.buyNFT(listing.id);
            await buyTx.wait();

            alert("NFT Purchased Successfully!");
            fetchListings(); // Refresh
        } catch (error: any) {
            console.error(error);
            alert("Purchase failed: " + (error.reason || error.message));
        } finally {
            setBuyingId(null);
        }
    };

    return (
        <div className="min-h-screen py-12 px-4 md:px-8">
            <h1 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Marketplace
            </h1>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
                </div>
            ) : listings.length === 0 ? (
                <div className="text-center text-gray-400 text-xl">
                    No items listed for sale yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {listings.map((listing) => (
                        <motion.div
                            key={listing.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all group"
                        >
                            <div className="aspect-square overflow-hidden relative">
                                <img
                                    src={listing.image}
                                    alt={listing.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                            </div>

                            <div className="p-4">
                                <h3 className="text-xl font-bold mb-1 truncate">{listing.name}</h3>
                                <p className="text-sm text-gray-400 mb-4 truncate">{listing.description}</p>

                                <div className="flex items-center justify-between">
                                    <div className="text-lg font-bold text-green-400">
                                        {listing.price} MKT
                                    </div>

                                    {account === listing.seller.toLowerCase() ? (
                                        <span className="text-xs bg-gray-700 px-2 py-1 rounded">You Own This</span>
                                    ) : (
                                        <button
                                            onClick={() => buyNFT(listing)}
                                            disabled={buyingId === listing.id || !account}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium disabled:opacity-50"
                                        >
                                            {buyingId === listing.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ShoppingCart className="w-4 h-4" />
                                            )}
                                            Buy Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
