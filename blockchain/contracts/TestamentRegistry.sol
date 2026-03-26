// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TestamentRegistry {
    enum Status { Pending, Approved, Rejected, Executed, Revoked }

    struct Testament {
        uint256 id;
        address testator;
        string ipfsCid;
        bytes32 documentHash;
        Status status;
        address notary;
        uint256 createdAt;
        uint256 updatedAt;
    }

    uint256 private nextId = 1;
    mapping(uint256 => Testament) public testaments;
    mapping(address => uint256[]) public testatorTestaments;
    mapping(address => bool) public authorizedNotaries;
    address public admin;

    event TestamentRegistered(uint256 indexed id, address indexed testator, string ipfsCid);
    event TestamentApproved(uint256 indexed id, address indexed notary);
    event TestamentRejected(uint256 indexed id, address indexed notary);
    event TestamentExecuted(uint256 indexed id);
    event NotaryAuthorized(address indexed notary);

    modifier onlyAdmin() { require(msg.sender == admin, "Not admin"); _; }
    modifier onlyNotary() { require(authorizedNotaries[msg.sender], "Not a notary"); _; }
    modifier testamentExists(uint256 id) { require(testaments[id].testator != address(0), "Not found"); _; }

    constructor() { admin = msg.sender; }

    function authorizeNotary(address notary) external onlyAdmin {
        authorizedNotaries[notary] = true;
        emit NotaryAuthorized(notary);
    }

    function registerTestament(string calldata ipfsCid, bytes32 documentHash) external returns (uint256) {
        uint256 id = nextId++;
        testaments[id] = Testament(id, msg.sender, ipfsCid, documentHash, Status.Pending, address(0), block.timestamp, block.timestamp);
        testatorTestaments[msg.sender].push(id);
        emit TestamentRegistered(id, msg.sender, ipfsCid);
        return id;
    }

    function approveTestament(uint256 id) external onlyNotary testamentExists(id) {
        require(testaments[id].status == Status.Pending, "Not pending");
        testaments[id].status = Status.Approved;
        testaments[id].notary = msg.sender;
        testaments[id].updatedAt = block.timestamp;
        emit TestamentApproved(id, msg.sender);
    }

    function rejectTestament(uint256 id) external onlyNotary testamentExists(id) {
        require(testaments[id].status == Status.Pending, "Not pending");
        testaments[id].status = Status.Rejected;
        testaments[id].notary = msg.sender;
        testaments[id].updatedAt = block.timestamp;
        emit TestamentRejected(id, msg.sender);
    }

    function confirmDeath(uint256 id) external onlyNotary testamentExists(id) {
        require(testaments[id].status == Status.Approved, "Not approved");
        testaments[id].status = Status.Executed;
        testaments[id].updatedAt = block.timestamp;
        emit TestamentExecuted(id);
    }

    function getTestatorTestaments(address testator) external view returns (uint256[] memory) {
        return testatorTestaments[testator];
    }
}

