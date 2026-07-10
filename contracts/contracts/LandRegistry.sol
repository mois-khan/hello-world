// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract LandRegistry is ERC721, AccessControl {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    enum ParcelStatus { Active, InTransfer }
    enum TransferStatus { None, PendingBuyer, PendingRegistrar, Completed, Rejected }

    struct Parcel {
        uint256 id;
        string  surveyNumber;
        string  district;
        string  geo;            // "lat,lng" or geohash
        uint256 area;           // sq. ft or sq. m
        bytes32 documentHash;   // SHA-256 of current title doc
        uint256 registeredAt;
        ParcelStatus status;
    }

    struct TransferRequest {
        uint256 parcelId;
        address seller;
        address buyer;
        bytes32 newDocumentHash;
        bool    sellerApproved;   // implicit-true on initiate
        bool    buyerApproved;
        bool    registrarApproved;
        TransferStatus status;
        uint256 createdAt;
    }

    uint256 public nextParcelId = 1;
    uint256 public nextTransferId = 1;
    mapping(uint256 => Parcel) public parcels;
    mapping(uint256 => TransferRequest) public transfers;
    mapping(uint256 => uint256) public activeTransferOf; // parcelId => transferId (0 if none)

    event ParcelRegistered(uint256 indexed parcelId, address indexed owner, string surveyNumber, bytes32 documentHash);
    event TransferInitiated(uint256 indexed transferId, uint256 indexed parcelId, address seller, address buyer);
    event TransferApproved(uint256 indexed transferId, address indexed by, string role);
    event TransferCompleted(uint256 indexed transferId, uint256 indexed parcelId, address indexed newOwner);
    event TransferRejected(uint256 indexed transferId, address indexed by, string reason);

    constructor() ERC721("BhoomiChain Land Title", "BHOOMI") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);   // govt admin
        _grantRole(REGISTRAR_ROLE, msg.sender);       // deployer is first registrar (demo convenience)
    }

    // --- Registration (registrar only) ---
    function registerParcel(
        address owner, string calldata surveyNumber, string calldata district,
        string calldata geo, uint256 area, bytes32 documentHash
    ) external onlyRole(REGISTRAR_ROLE) returns (uint256 id) {
        id = nextParcelId++;
        parcels[id] = Parcel(id, surveyNumber, district, geo, area, documentHash, block.timestamp, ParcelStatus.Active);
        _safeMint(owner, id);
        emit ParcelRegistered(id, owner, surveyNumber, documentHash);
    }

    // --- Transfer workflow ---
    function initiateTransfer(uint256 parcelId, address buyer, bytes32 newDocumentHash) external returns (uint256 tid) {
        require(ownerOf(parcelId) == msg.sender, "Not owner");
        require(parcels[parcelId].status == ParcelStatus.Active, "Parcel busy"); // blocks double-sale
        require(buyer != address(0) && buyer != msg.sender, "Bad buyer");
        tid = nextTransferId++;
        transfers[tid] = TransferRequest(parcelId, msg.sender, buyer, newDocumentHash, true, false, false, TransferStatus.PendingBuyer, block.timestamp);
        parcels[parcelId].status = ParcelStatus.InTransfer;
        activeTransferOf[parcelId] = tid;
        emit TransferInitiated(tid, parcelId, msg.sender, buyer);
        emit TransferApproved(tid, msg.sender, "seller");
    }

    function buyerApprove(uint256 tid) external {
        TransferRequest storage t = transfers[tid];
        require(t.status == TransferStatus.PendingBuyer, "Wrong state");
        require(msg.sender == t.buyer, "Not buyer");
        t.buyerApproved = true;
        t.status = TransferStatus.PendingRegistrar;
        emit TransferApproved(tid, msg.sender, "buyer");
    }

    function registrarFinalize(uint256 tid) external onlyRole(REGISTRAR_ROLE) {
        TransferRequest storage t = transfers[tid];
        require(t.status == TransferStatus.PendingRegistrar, "Wrong state");
        t.registrarApproved = true;
        t.status = TransferStatus.Completed;
        Parcel storage p = parcels[t.parcelId];
        p.status = ParcelStatus.Active;
        p.documentHash = t.newDocumentHash;
        activeTransferOf[t.parcelId] = 0;
        _transfer(t.seller, t.buyer, t.parcelId);   // atomic ownership move
        emit TransferApproved(tid, msg.sender, "registrar");
        emit TransferCompleted(tid, t.parcelId, t.buyer);
    }

    function rejectTransfer(uint256 tid, string calldata reason) external {
        TransferRequest storage t = transfers[tid];
        require(t.status == TransferStatus.PendingBuyer || t.status == TransferStatus.PendingRegistrar, "Cannot reject");
        require(msg.sender == t.buyer || msg.sender == t.seller || hasRole(REGISTRAR_ROLE, msg.sender), "Not a party");
        t.status = TransferStatus.Rejected;
        parcels[t.parcelId].status = ParcelStatus.Active;
        activeTransferOf[t.parcelId] = 0;
        emit TransferRejected(tid, msg.sender, reason);
    }

    // --- Lock rogue transfers: only the workflow (_transfer above) may move tokens ---
    function transferFrom(address, address, uint256) public pure override { revert("Use transfer workflow"); }
    function safeTransferFrom(address, address, uint256) public pure override { revert("Use transfer workflow"); }
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override { revert("Use transfer workflow"); }

    function supportsInterface(bytes4 id) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(id);
    }
}
