export const PAYMENT_TOKEN_ABI = [
    "function claimTokens() external",
    "function balanceOf(address account) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function transfer(address recipient, uint256 amount) external returns (bool)",
    "event TokensClaimed(address indexed user, uint256 amount)"
];

export const OPEN_NFT_ABI = [
    "function mintNFT(string memory tokenURI) public returns (uint256)",
    "function tokenURI(uint256 tokenId) external view returns (string memory)",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function approve(address to, uint256 tokenId) external",
    "function getApproved(uint256 tokenId) external view returns (address)",
    "function setApprovalForAll(address operator, bool approved) external",
    "function isApprovedForAll(address owner, address operator) external view returns (bool)",
    "event NFTMinted(address indexed minter, uint256 tokenId, string tokenURI)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

export const MARKETPLACE_ABI = [
    "function listNFT(address _nftContract, uint256 _tokenId, uint256 _price) external payable",
    "function buyNFT(uint256 _listingId) external",
    "function cancelListing(uint256 _listingId) external",
    "function listings(uint256) external view returns (address seller, address nftContract, uint256 tokenId, uint256 price, bool isActive)",
    "function listingFee() external view returns (uint256)",
    "event ItemListed(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price)",
    "event ItemSold(uint256 indexed listingId, address indexed buyer, uint256 price)",
    "event ListingCancelled(uint256 indexed listingId)"
];
