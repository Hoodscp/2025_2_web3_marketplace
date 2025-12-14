"use client";

import { useState } from "react";
import { useWeb3 } from "../../context/Web3Context";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../../utils/ipfs";
import { motion } from "framer-motion";
import { Upload, Image as ImageIcon } from "lucide-react";

export default function MintPage() {
    const { contracts, account } = useWeb3();
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const mintNFT = async () => {
        if (!file || !name || !description || !contracts.openNFT) return;

        try {
            setLoading(true);
            setStatus("Uploading image to IPFS...");

            const imageHash = await uploadFileToIPFS(file);
            const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageHash}`;

            setStatus("Uploading metadata to IPFS...");
            const metadata = {
                name,
                description,
                image: imageUrl,
            };
            const metadataHash = await uploadJSONToIPFS(metadata);
            const tokenURI = `https://gateway.pinata.cloud/ipfs/${metadataHash}`;

            setStatus("Minting NFT...");
            const tx = await contracts.openNFT.mintNFT(tokenURI);
            await tx.wait();

            setStatus("NFT Minted Successfully!");
            alert("NFT Minted Successfully!");

            // Reset form
            setFile(null);
            setName("");
            setDescription("");
        } catch (error: any) {
            console.error(error);
            setStatus("Error: " + (error.reason || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl"
            >
                <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                    Mint Your NFT
                </h1>

                <div className="space-y-6">
                    {/* Image Upload */}
                    <div className="relative group">
                        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${file ? 'border-purple-500 bg-purple-500/10' : 'border-gray-600 hover:border-gray-400'}`}>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {file ? (
                                <div className="flex flex-col items-center">
                                    <ImageIcon className="w-12 h-12 text-purple-400 mb-2" />
                                    <p className="text-sm text-gray-300">{file.name}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Upload className="w-12 h-12 text-gray-400 mb-2 group-hover:text-white transition-colors" />
                                    <p className="text-sm text-gray-400 group-hover:text-white transition-colors">Click or drag image to upload</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            placeholder="NFT Name"
                        />
                    </div>

                    {/* Description Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors h-32 resize-none"
                            placeholder="Description of your NFT"
                        />
                    </div>

                    <button
                        onClick={mintNFT}
                        disabled={loading || !file || !name || !description || !account}
                        className="w-full py-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? status : "Mint NFT"}
                    </button>

                    {!account && (
                        <p className="text-center text-sm text-red-400">
                            Please connect your wallet to mint
                        </p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
