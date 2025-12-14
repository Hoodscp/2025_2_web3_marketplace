"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ethers } from "ethers";
import {
    PAYMENT_TOKEN_ADDRESS,
    OPEN_NFT_ADDRESS,
    MARKETPLACE_ADDRESS,
} from "../utils/constants";
import { PAYMENT_TOKEN_ABI, OPEN_NFT_ABI, MARKETPLACE_ABI } from "../utils/abis";

interface Web3ContextType {
    account: string | null;
    provider: ethers.BrowserProvider | null;
    signer: ethers.JsonRpcSigner | null;
    contracts: {
        paymentToken: ethers.Contract | null;
        openNFT: ethers.Contract | null;
        marketplace: ethers.Contract | null;
    };
    connectWallet: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType>({
    account: null,
    provider: null,
    signer: null,
    contracts: { paymentToken: null, openNFT: null, marketplace: null },
    connectWallet: async () => { },
});

export function Web3Provider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<string | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
    const [contracts, setContracts] = useState<{
        paymentToken: ethers.Contract | null;
        openNFT: ethers.Contract | null;
        marketplace: ethers.Contract | null;
    }>({
        paymentToken: null,
        openNFT: null,
        marketplace: null,
    });

    const connectWallet = useCallback(async () => {
        if (typeof window.ethereum !== "undefined") {
            try {
                const _provider = new ethers.BrowserProvider(window.ethereum);
                const _signer = await _provider.getSigner();
                const _account = await _signer.getAddress();

                setProvider(_provider);
                setSigner(_signer);
                setAccount(_account);

                const paymentToken = new ethers.Contract(
                    PAYMENT_TOKEN_ADDRESS,
                    PAYMENT_TOKEN_ABI,
                    _signer
                );
                const openNFT = new ethers.Contract(
                    OPEN_NFT_ADDRESS,
                    OPEN_NFT_ABI,
                    _signer
                );
                const marketplace = new ethers.Contract(
                    MARKETPLACE_ADDRESS,
                    MARKETPLACE_ABI,
                    _signer
                );

                setContracts({ paymentToken, openNFT, marketplace });
            } catch (error) {
                console.error("Failed to connect wallet:", error);
            }
        } else {
            alert("Please install MetaMask!");
        }
    }, []);

    useEffect(() => {
        if (typeof window.ethereum !== "undefined") {
            window.ethereum.on("accountsChanged", (accounts: string[]) => {
                if (accounts.length > 0) {
                    connectWallet();
                } else {
                    setAccount(null);
                    setSigner(null);
                    setContracts({ paymentToken: null, openNFT: null, marketplace: null });
                }
            });
        }
    }, [connectWallet]);

    return (
        <Web3Context.Provider value={{ account, provider, signer, contracts, connectWallet }}>
            {children}
        </Web3Context.Provider>
    );
}

export const useWeb3 = () => useContext(Web3Context);
