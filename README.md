# Web3 NFT Marketplace Project Report (Web3 NFT 마켓플레이스 프로젝트 보고서)

[English Version](#english-version) | [한국어 버전](#한국어-버전)

---

<a name="한국어-버전"></a>
## 1. 프로젝트 개요
이 프로젝트는 **Next.js** 프론트엔드와 **Solidity** 스마트 컨트랙트를 기반으로 구축된 기능적 분산형 NFT 마켓플레이스입니다. 사용자는 다음과 같은 활동을 할 수 있습니다:
- IPFS에 메타데이터를 저장하여 자신만의 고유한 **NFT 민팅**.
- 커스텀 ERC-20 토큰(MarketToken)을 사용한 **NFT 거래**.
- 개인 대시보드를 통한 **디지털 자산 관리**.

이 시스템은 지갑 연결부터 "Approve-and-Call" 패턴과 같은 복잡한 컨트랙트 상호작용에 이르기까지 전체 Web3 인터랙션 흐름을 보여주도록 설계되었습니다.

---

## 2. 스마트 컨트랙트 아키텍처
핵심 로직은 `contract/` 디렉토리에 있으며, 4개의 주요 컨트랙트로 구성됩니다:

### A. PaymentToken (`erc20.sol`)
*   **표준**: ERC-20
*   **이름/심볼**: MarketToken (MKT)
*   **목적**: 마켓플레이스에서 결제 수단으로 사용되는 통화.
*   **핵심 로직**:
    *   `claimTokens()`: 사용자가 24시간마다 한 번씩 **1,000 MKT**를 받을 수 있는 faucet 기능.
    *   초기 물량은 배포자에게 발행됩니다.

### B. OpenNFT (`nft_public.sol`)
*   **표준**: ERC-721 (URIStorage 확장)
*   **이름/심볼**: OpenArtNFT (OAN)
*   **목적**: 플랫폼에서 거래되는 디지털 자산.
*   **핵심 로직**:
    *   `mintNFT(string memory tokenURI)`: 누구나 IPFS 해시를 제공하여 새로운 NFT를 민팅할 수 있습니다.
    *   제한 없는 민팅 설계를 통해 사용자 참여를 독려합니다.

### C. TokenMarketplace (`marketplace.sol`)
*   **목적**: NFT 거래 중개.
*   **핵심 로직**:
    *   `listNFT(...)`: 사용자가 특정 MKT 가격으로 NFT를 판매 등록합니다.
        *   **수수료**: 스팸 방지를 위해 리스팅 시 **0.001 ETH**의 수수료가 부과됩니다.
        *   **에스크로**: 리스팅 기간 동안 NFT는 마켓플레이스 컨트랙트로 전송되어 보관됩니다.
    *   `buyNFT(...)`: 구매자가 NFT를 구매합니다.
        *   MKT를 구매자에게서 판매자에게로 전송합니다.
        *   NFT를 마켓플레이스에서 구매자에게로 전송합니다.
    *   `cancelListing(...)`: 판매되지 않은 경우 판매자가 리스팅을 취소하고 NFT를 회수할 수 있습니다.
    *   **보안**: `ReentrancyGuard`를 구현하고 Checks-Effects-Interactions 패턴을 준수합니다.

---

## 3. 프론트엔드 아키텍처
프론트엔드는 **Next.js 14+ (App Router)**와 **TypeScript**로 구축되었으며, **Tailwind CSS**를 사용하여 스타일링되었습니다.

### 디렉토리 구조 (`src/`)

#### `app/` (페이지 및 라우팅)
*   **`page.tsx` (Home)**:
    *   플랫폼 소개 및 **Faucet UI**. 사용자가 테스트용 토큰을 받을 수 있는 버튼 제공.
*   **`mint/page.tsx`**:
    *   파일 업로드 및 **IPFS(Pinata)** 연동. 이미지와 JSON 메타데이터를 업로드한 후 `openNFT.mintNFT()`를 호출합니다.
*   **`marketplace/page.tsx`**:
    *   `ItemListed` 이벤트를 조회하여 활성 판매 목록을 표시합니다. ERC-20 `approve` 및 `buyNFT` 흐름을 처리합니다.
*   **`dashboard/page.tsx`**:
    *   사용자가 소유한 NFT 표시 및 판매 등록 기능을 제공합니다.

#### `context/Web3Context.tsx`
*   **MetaMask** 지갑 연결 및 글로벌 Web3 상태 관리. **Ethers.js**를 사용하여 컨트랙트 인스턴스를 생성하고 앱 전체에 제공합니다.

---

## 4. 주요 워크플로우

1.  **사용자 온보딩**: 지갑 연결 후 Home에서 1,000 MKT 토큰 클레임.
2.  **NFT 생성**: Mint 페이지에서 이미지 업로드 -> IPFS 저장 -> 메타데이터 생성 -> NFT 민팅 완료.
3.  **NFT 판매**: 대시보드에서 가격 설정 -> 마켓플레이스 권한 승인(`setApprovalForAll`) -> 리스팅 수수료 지불 및 등록.
4.  **NFT 구매**: 마켓플레이스에서 아이템 선택 -> 토큰 사용 승인(`approve`) -> 구매 확정 및 자산 수령.

---

## 5. 기술 스택
*   **Blockchain**: Ethereum (EVM Compatible), Solidity v0.8.20
*   **Web Framework**: Next.js 14 (React)
*   **Language**: TypeScript
*   **Library**: Ethers.js v6, Axios, Framer Motion
*   **Storage**: IPFS (via Pinata)

---
<a name="english-version"></a>

## English Version

## 1. Project Overview
This project is a fully functional decentralized NFT marketplace built using **Next.js** for the frontend and **Solidity** for the smart contracts. It creates an ecosystem where users can:
- **Mint** their own unique NFTs with metadata stored on IPFS.
- **Trade** NFTs using a custom ERC-20 token (MarketToken).
- **Manage** their digital assets via a personal dashboard.

---

## 2. Smart Contract Architecture
The core logic resides in the `contract/` directory:

### A. PaymentToken (`erc20.sol`)
*   **Standard**: ERC-20 (MarketToken - MKT)
*   **Key Logic**: Faucet function `claimTokens()` allows users to get 1,000 MKT daily for testing.

### B. OpenNFT (`nft_public.sol`)
*   **Standard**: ERC-721 (OpenArtNFT - OAN)
*   **Key Logic**: `mintNFT` allows any user to create an NFT with an IPFS metadata URI.

### C. TokenMarketplace (`marketplace.sol`)
*   **Key Logic**: Handles `listNFT` (with 0.001 ETH fee), `buyNFT` (MKT payments), and `cancelListing`. Implements escrow and security patterns.

---

## 3. Frontend Architecture
Built with **Next.js 14+**, **TypeScript**, and **Tailwind CSS**.

- **`Web3Context.tsx`**: Manages MetaMask connection and Ethers.js contract instances.
- **`ipfs.ts`**: Handles decentralized storage uploads via Pinata API.
- **Pages**: Home (Faucet), Mint (Creation), Marketplace (Trading), and Dashboard (Asset Management).

---

## 4. Key Workflows
1. **Onboarding**: Connect wallet and claim test tokens.
2. **Minting**: Upload image to IPFS -> Create metadata -> Mint on-chain.
3. **Selling**: Set price -> Approve marketplace -> List NFT.
4. **Buying**: Approve MKT spending -> Confirm purchase.

---

## 5. Technology Stack
*   **Blockchain**: Solidity v0.8.20
*   **Frontend**: Next.js 14, TypeScript, Tailwind CSS
*   **Libraries**: Ethers.js v6, Axios, Framer Motion
*   **Storage**: IPFS via Pinata
