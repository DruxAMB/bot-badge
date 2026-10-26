// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Initializable} from "openzeppelin-contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "openzeppelin-contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "openzeppelin-contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ERC721Upgradeable} from "openzeppelin-contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ECDSA} from "openzeppelin-contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "openzeppelin-contracts/utils/cryptography/MessageHashUtils.sol";

/// @title BotBadge — non-transferable learn-to-earn badge on BOT Chain.
/// mint() requires a voucher signed by the quiz backend over
/// (contract, chainId, recipient). One badge per wallet, forever bound:
/// transfers are disabled; mint and burn remain possible.
contract BotBadge is Initializable, ERC721Upgradeable, UUPSUpgradeable, OwnableUpgradeable {
    address public voucherSigner;
    uint256 public totalMinted;
    mapping(address => bool) public hasMinted;

    event BadgeMinted(address indexed to, uint256 indexed tokenId);
    event VoucherSignerSet(address indexed signer);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(address owner_, address voucherSigner_) external initializer {
        require(voucherSigner_ != address(0), "zero signer");
        __ERC721_init("BOT Badge", "BOTBADGE");
        __Ownable_init(owner_);
        voucherSigner = voucherSigner_;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function setVoucherSigner(address signer) external onlyOwner {
        require(signer != address(0), "zero signer");
        voucherSigner = signer;
        emit VoucherSignerSet(signer);
    }

    /// @notice Mint your badge with a voucher from the quiz backend.
    /// Voucher = EIP-191 signature over keccak256(abi.encodePacked(contract, chainid, msg.sender)).
    function mint(bytes calldata voucher) external returns (uint256 tokenId) {
        require(!hasMinted[msg.sender], "already minted");

        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
            keccak256(abi.encodePacked(address(this), block.chainid, msg.sender))
        );
        require(ECDSA.recover(digest, voucher) == voucherSigner, "bad voucher");

        hasMinted[msg.sender] = true;
        tokenId = ++totalMinted;
        _safeMint(msg.sender, tokenId);
        emit BadgeMinted(msg.sender, tokenId);
    }

    function badgeOf(address who) external view returns (uint256 tokenId, bool has) {
        has = hasMinted[who];
        tokenId = _tokenOf[who];
    }

    mapping(address => uint256) private _tokenOf;

    /// @dev Soulbound: mint (from=0) and burn (to=0) allowed, transfers blocked.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address from)
    {
        from = super._update(to, tokenId, auth);
        if (from != address(0) && to != address(0)) revert("soulbound");
        if (from == address(0)) _tokenOf[to] = tokenId;
        else if (to == address(0)) delete _tokenOf[from];
    }

    uint256[45] private __gap;
}
