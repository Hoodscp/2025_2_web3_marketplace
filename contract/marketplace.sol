// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenMarketplace is ReentrancyGuard, Ownable {
    
    // 거래에 사용될 특정 ERC-20 토큰 컨트랙트
    IERC20 public paymentToken;
    
    // 추가 기능: 리스팅 수수료 (판매 등록 시 지불해야 하는 ETH)
    uint256 public listingFee = 0.001 ether;

    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price; // ERC-20 토큰 기준 가격
        bool isActive;
    }

    // listingId => Listing 정보
    mapping(uint256 => Listing) public listings;
    uint256 private _listingIdCounter;

    event ItemListed(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price);
    event ItemSold(uint256 indexed listingId, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed listingId);

    constructor(address _paymentTokenAddress) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentTokenAddress);
    }

    // 리스팅 수수료 변경 기능 (관리자 전용)
    function setListingFee(uint256 _newFee) external onlyOwner {
        listingFee = _newFee;
    }

    // 기능 3: NFT 판매 등록 (리스팅) - ERC-20 토큰 가격 설정
    // 주의: 사용자는 미리 NFT 컨트랙트에서 setApprovalForAll을 이 마켓플레이스 주소로 실행해야 함
    function listNFT(address _nftContract, uint256 _tokenId, uint256 _price) external payable nonReentrant {
        require(_price > 0, "Price must be greater than zero");
        require(msg.value == listingFee, "Must pay the listing fee");

        // NFT 소유권 확인 및 전송 (판매자 -> 마켓플레이스)
        // 실제 거래 시 안전을 위해 마켓이 NFT를 에스크로(보관)합니다.
        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);

        _listingIdCounter++;
        listings[_listingIdCounter] = Listing({
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            price: _price,
            isActive: true
        });

        emit ItemListed(_listingIdCounter, msg.sender, _nftContract, _tokenId, _price);
    }

    // 기능 3: NFT 구매 - 1번에서 발행한 ERC-20 토큰으로만 결제
    // 주의: 구매자는 미리 ERC-20 토큰 컨트랙트에서 approve를 이 마켓플레이스 주소로 실행해야 함
    function buyNFT(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        
        require(listing.isActive, "Listing is not active");
        require(msg.sender != listing.seller, "Seller cannot buy their own item");

        // [보안 개선] Effects(상태 변경)를 Interactions(외부 호출)보다 먼저 수행
        // 재진입 공격 방지 패턴 (Check-Effects-Interactions)
        listing.isActive = false;

        // 토큰 전송: 구매자 -> 판매자
        bool success = paymentToken.transferFrom(msg.sender, listing.seller, listing.price);
        require(success, "Token transfer failed");

        // NFT 전송: 마켓플레이스 -> 구매자
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);

        emit ItemSold(_listingId, msg.sender, listing.price);
    }

    // 판매 취소 기능
    function cancelListing(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        
        require(listing.isActive, "Listing is not active");
        require(msg.sender == listing.seller, "Only seller can cancel");

        // [보안 개선] 상태 변경 먼저 수행
        listing.isActive = false;

        // NFT 반환: 마켓플레이스 -> 판매자
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);

        emit ListingCancelled(_listingId);
    }

    // 마켓플레이스에 쌓인 수수료 출금 (관리자 전용)
    // [수정] transfer -> call 변경
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdraw failed");
    }
}