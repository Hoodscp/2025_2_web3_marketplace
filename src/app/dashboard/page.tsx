'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWeb3 } from '../../context/Web3Context'
import { ethers } from 'ethers'
import { motion } from 'framer-motion'
import { Loader2, Tag } from 'lucide-react'
import axios from 'axios'

interface NFT {
  tokenId: number
  name: string
  description: string
  image: string
}

export default function DashboardPage() {
  const { contracts, account } = useWeb3()
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [listingId, setListingId] = useState<number | null>(null)
  const [price, setPrice] = useState('')

  // 추가 상태: 토큰 잔액 관련
  const [tokenBalance, setTokenBalance] = useState<string | null>(null)
  const [tokenSymbol, setTokenSymbol] = useState<string>('MKT')
  const [tokenLoading, setTokenLoading] = useState<boolean>(false)

  // 토큰 컨트랙트 후보 이름들(프로젝트별로 다를 수 있으니 여러 후보 검사)
  const findTokenContract = () => {
    if (!contracts) return null
    const candidates = [
      'token',
      'mktToken',
      'marketToken',
      'marketplaceToken',
      'paymentToken',
      'erc20',
      'tokenContract',
    ]
    for (const key of candidates) {
      if ((contracts as any)[key]) return (contracts as any)[key]
    }
    // fallback: 만약 contracts에 직접 ERC20 인터페이스가 할당되어 있다면 반환
    return (contracts as any).token || null
  }

  // 토큰 잔액 조회
  const fetchTokenBalance = useCallback(async () => {
    if (!account || !contracts) {
      setTokenBalance(null)
      return
    }
    const tokenContract = findTokenContract()
    if (!tokenContract) {
      setTokenBalance(null)
      return
    }

    try {
      setTokenLoading(true)
      // balanceOf, decimals, symbol은 ERC-20 표준
      const [rawBalance, decimals, symbol] = await Promise.all([
        tokenContract.balanceOf(account).catch(() => null),
        tokenContract.decimals?.().catch(() => 18),
        tokenContract.symbol?.().catch(() => 'MKT'),
      ])

      const dec =
        typeof decimals === 'number' ? decimals : Number(decimals || 18)
      const sym = symbol || 'MKT'

      if (rawBalance && rawBalance.toString) {
        const formatted = ethers.formatUnits(rawBalance, dec)
        setTokenBalance(formatted)
      } else {
        setTokenBalance('0')
      }
      setTokenSymbol(sym)
    } catch (err) {
      console.error('Error fetching token balance', err)
      setTokenBalance(null)
    } finally {
      setTokenLoading(false)
    }
  }, [contracts, account])

  // 기존 NFT 조회 로직
  const fetchMyNFTs = useCallback(async () => {
    if (!contracts.openNFT || !account) return

    try {
      setLoading(true)
      // Get Transfer events to the user
      const filter = contracts.openNFT.filters.Transfer(null, account)
      const events = await contracts.openNFT.queryFilter(filter)

      const myNFTs: NFT[] = []
      const processedTokenIds = new Set<number>()

      // Iterate backwards to get latest first
      for (const event of events.reverse()) {
        if ('args' in event) {
          const tokenId = Number(event.args.tokenId)

          if (processedTokenIds.has(tokenId)) continue
          processedTokenIds.add(tokenId)

          // Verify ownership (user might have transferred it out)
          try {
            const owner = await contracts.openNFT.ownerOf(tokenId)
            if (owner.toLowerCase() !== account.toLowerCase()) continue

            const tokenURI = await contracts.openNFT.tokenURI(tokenId)
            let metadata = {
              name: `NFT #${tokenId}`,
              description: 'No description',
              image: '/placeholder.png',
            }

            try {
              const url = tokenURI.replace(
                'ipfs://',
                'https://gateway.pinata.cloud/ipfs/'
              )
              const { data } = await axios.get(url)
              metadata = data
            } catch (e) {
              console.error('Error fetching metadata', e)
            }

            myNFTs.push({
              tokenId,
              name: metadata.name,
              description: metadata.description,
              image: metadata.image.replace(
                'ipfs://',
                'https://gateway.pinata.cloud/ipfs/'
              ),
            })
          } catch (e) {
            console.error('Error checking ownership', e)
          }
        }
      }

      setNfts(myNFTs)
    } catch (error) {
      console.error('Error fetching NFTs:', error)
    } finally {
      setLoading(false)
    }
  }, [contracts.openNFT, account])

  useEffect(() => {
    if (contracts.openNFT && account) {
      fetchMyNFTs()
    }
  }, [contracts.openNFT, account, fetchMyNFTs])

  // 토큰 잔액은 contracts 또는 account 변경 시 조회
  useEffect(() => {
    if (account && contracts) {
      fetchTokenBalance()
    } else {
      setTokenBalance(null)
    }
  }, [account, contracts, fetchTokenBalance])

  const listNFT = async (tokenId: number) => {
    if (!contracts.marketplace || !contracts.openNFT || !price) return

    try {
      setListingId(tokenId)
      const priceInWei = ethers.parseEther(price)
      const listingFee = await contracts.marketplace.listingFee()

      // 1. Approve Marketplace
      const isApproved = await contracts.openNFT.isApprovedForAll(
        account,
        await contracts.marketplace.getAddress()
      )
      if (!isApproved) {
        const approveTx = await contracts.openNFT.setApprovalForAll(
          await contracts.marketplace.getAddress(),
          true
        )
        await approveTx.wait()
      }

      // 2. List Item
      const listTx = await contracts.marketplace.listNFT(
        await contracts.openNFT.getAddress(),
        tokenId,
        priceInWei,
        { value: listingFee }
      )
      await listTx.wait()

      alert('NFT Listed Successfully!')
      setPrice('')
      setListingId(null)
      // Ideally remove from list or refresh
      // refresh token balance after listing (optional)
      fetchTokenBalance()
    } catch (error: any) {
      console.error(error)
      alert('Listing failed: ' + (error.reason || error.message))
      setListingId(null)
    }
  }

  if (!account) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-xl text-gray-400">
          Please connect your wallet to view your dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 md:px-8">
      <h1 className="text-4xl font-bold mb-3 text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
        My Collection
      </h1>

      {/* 토큰 잔액 표시 */}
      <div className="mb-6 flex justify-center items-center gap-3">
        <div className="text-sm text-gray-300">Token Balance:</div>
        {tokenLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
            <span>Checking...</span>
          </div>
        ) : (
          <div className="text-sm font-medium text-white">
            {tokenBalance !== null
              ? `${tokenBalance} ${tokenSymbol}`
              : `- ${tokenSymbol}`}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center text-gray-400 text-xl">
          You don't own any NFTs yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {nfts.map((nft) => (
            <motion.div
              key={nft.tokenId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10"
            >
              <div className="aspect-square overflow-hidden relative">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4">
                <h3 className="text-xl font-bold mb-1 truncate">{nft.name}</h3>
                <p className="text-sm text-gray-400 mb-4 truncate">
                  {nft.description}
                </p>

                <div className="flex flex-col gap-2">
                  {listingId === nft.tokenId ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                      <span className="text-sm text-gray-400">
                        Processing...
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Price (MKT)"
                        className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                        onChange={(e) => setPrice(e.target.value)}
                      />
                      <button
                        onClick={() => listNFT(nft.tokenId)}
                        disabled={!price}
                        className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        List
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
