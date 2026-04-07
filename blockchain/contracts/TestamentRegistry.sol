// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TestamentRegistry {

    // ============ ENUMS ============
    enum Status { 
        Draft,
        Pending, 
        Approved, 
        Rejected, 
        DeathReported, 
        Executed 
    }

    enum Role { 
        None, 
        Testator, 
        Notary, 
        Heir, 
        Admin 
    }

    // ============ STRUCTS ============
    struct Testament {
        uint256 id;
        address testator;
        address assignedNotary;
        string ipfsCid;
        bytes32 documentHash;
        Status status;
        uint256 createdAt;
        uint256 updatedAt;
        string deathCertificateCid;
        string rejectionReason;
        bool exists;
    }

    struct Heir {
        address walletAddress;
        string name;
        uint256 sharePercent;
        string encryptedCid;
        bool canAccess;
    }

    struct NotaryInfo {
        address walletAddress;
        string name;
        string publicKey;
        bool isActive;
        bool isAlive;
        address keyBackupNotary;
    }

    struct UserInfo {
        Role role;
        string name;
        string civilStatus;
        bool exists;
    }

    // ============ STATE VARIABLES ============
    address public admin;
    uint256 private nextTestamentId = 1;

    mapping(address => UserInfo) public users;
    mapping(address => NotaryInfo) public notaries;
    address[] public notaryList;

    mapping(uint256 => Testament) public testaments;
    mapping(uint256 => Heir[]) public testamentHeirs;
    mapping(address => uint256[]) public testatorTestaments;
    mapping(address => uint256[]) public heirTestaments;
    mapping(address => uint256[]) public notaryTestaments;

    // ============ EVENTS ============
    event UserRegistered(address indexed wallet, Role role, string name);
    event NotaryAdded(address indexed notary, string name);
    event NotaryRemoved(address indexed notary);
    event NotaryKeyTransferred(address indexed fromNotary, address indexed toNotary);
    event TestamentCreated(uint256 indexed id, address indexed testator, address indexed notary, string cid);
    event TestamentApproved(uint256 indexed id, address indexed notary);
    event TestamentRejected(uint256 indexed id, address indexed notary, string reason);
    event DeathReported(uint256 indexed id, address indexed heir, string deathCertCid);
    event DeathConfirmed(uint256 indexed id, address indexed notary);
    event HeirAccessGranted(uint256 indexed id, address indexed heir, string encryptedCid);

    // ============ MODIFIERS ============
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyNotary() {
        require(
            notaries[msg.sender].isActive && notaries[msg.sender].isAlive,
            "Not an active notary"
        );
        _;
    }

    modifier onlyTestator() {
        require(users[msg.sender].role == Role.Testator, "Not a testator");
        _;
    }

    modifier testamentExists(uint256 id) {
        require(testaments[id].exists, "Testament not found");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(string memory adminName) {
        admin = msg.sender;
        users[msg.sender] = UserInfo({
            role: Role.Admin,
            name: adminName,
            civilStatus: "",
            exists: true
        });
    }

    // ============ ADMIN FUNCTIONS ============
    function addNotary(
        address notaryAddr,
        string memory name,
        string memory publicKey
    ) external onlyAdmin {
        require(!notaries[notaryAddr].isActive, "Already a notary");
        notaries[notaryAddr] = NotaryInfo({
            walletAddress: notaryAddr,
            name: name,
            publicKey: publicKey,
            isActive: true,
            isAlive: true,
            keyBackupNotary: address(0)
        });
        users[notaryAddr] = UserInfo({
            role: Role.Notary,
            name: name,
            civilStatus: "",
            exists: true
        });
        notaryList.push(notaryAddr);
        emit NotaryAdded(notaryAddr, name);
    }

    function removeNotary(address notaryAddr) external onlyAdmin {
        require(notaries[notaryAddr].isActive, "Not a notary");
        notaries[notaryAddr].isActive = false;
        users[notaryAddr].role = Role.None;
        emit NotaryRemoved(notaryAddr);
    }

    function transferNotaryKey(
        address deadNotary,
        address newNotary
    ) external onlyAdmin {
        require(!notaries[deadNotary].isAlive, "Notary not marked as dead");
        require(notaries[newNotary].isActive, "New notary not active");
        notaries[deadNotary].keyBackupNotary = newNotary;
        emit NotaryKeyTransferred(deadNotary, newNotary);
    }

    function markNotaryDead(address notaryAddr) external onlyAdmin {
        require(notaries[notaryAddr].isActive, "Not a notary");
        notaries[notaryAddr].isAlive = false;
        notaries[notaryAddr].isActive = false;
    }

    // ============ USER REGISTRATION ============
    function registerTestator(
        string memory name,
        string memory civilStatus
    ) external {
        require(!users[msg.sender].exists, "Already registered");
        users[msg.sender] = UserInfo({
            role: Role.Testator,
            name: name,
            civilStatus: civilStatus,
            exists: true
        });
        emit UserRegistered(msg.sender, Role.Testator, name);
    }

    function registerHeir(string memory name) external {
        require(!users[msg.sender].exists, "Already registered");
        users[msg.sender] = UserInfo({
            role: Role.Heir,
            name: name,
            civilStatus: "",
            exists: true
        });
        emit UserRegistered(msg.sender, Role.Heir, name);
    }

    // ============ TESTAMENT FUNCTIONS ============
    function createTestament(
        string memory ipfsCid,
        bytes32 documentHash,
        address notaryAddr,
        address[] memory heirAddresses,
        string[] memory heirNames,
        uint256[] memory heirShares
    ) external onlyTestator returns (uint256) {
        require(notaries[notaryAddr].isActive, "Notary not active");
        require(heirAddresses.length == heirNames.length, "Heirs mismatch");
        require(heirAddresses.length == heirShares.length, "Shares mismatch");

        uint256 id = nextTestamentId++;
        testaments[id] = Testament({
            id: id,
            testator: msg.sender,
            assignedNotary: notaryAddr,
            ipfsCid: ipfsCid,
            documentHash: documentHash,
            status: Status.Pending,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deathCertificateCid: "",
            rejectionReason: "",
            exists: true
        });

        for (uint256 i = 0; i < heirAddresses.length; i++) {
            testamentHeirs[id].push(Heir({
                walletAddress: heirAddresses[i],
                name: heirNames[i],
                sharePercent: heirShares[i],
                encryptedCid: "",
                canAccess: false
            }));
            heirTestaments[heirAddresses[i]].push(id);
        }

        testatorTestaments[msg.sender].push(id);
        notaryTestaments[notaryAddr].push(id);

        emit TestamentCreated(id, msg.sender, notaryAddr, ipfsCid);
        return id;
    }

    function approveTestament(
        uint256 id
    ) external onlyNotary testamentExists(id) {
        require(testaments[id].assignedNotary == msg.sender, "Not your testament");
        require(testaments[id].status == Status.Pending, "Not pending");
        testaments[id].status = Status.Approved;
        testaments[id].updatedAt = block.timestamp;
        emit TestamentApproved(id, msg.sender);
    }

    function rejectTestament(
        uint256 id,
        string memory reason
    ) external onlyNotary testamentExists(id) {
        require(testaments[id].assignedNotary == msg.sender, "Not your testament");
        require(testaments[id].status == Status.Pending, "Not pending");
        testaments[id].status = Status.Rejected;
        testaments[id].rejectionReason = reason;
        testaments[id].updatedAt = block.timestamp;
        emit TestamentRejected(id, msg.sender, reason);
    }

    function reportDeath(
        uint256 id,
        string memory deathCertCid
    ) external testamentExists(id) {
        require(testaments[id].status == Status.Approved, "Not approved yet");
        bool isHeir = false;
        for (uint256 i = 0; i < testamentHeirs[id].length; i++) {
            if (testamentHeirs[id][i].walletAddress == msg.sender) {
                isHeir = true;
                break;
            }
        }
        require(isHeir, "Not an heir of this testament");
        testaments[id].status = Status.DeathReported;
        testaments[id].deathCertificateCid = deathCertCid;
        testaments[id].updatedAt = block.timestamp;
        emit DeathReported(id, msg.sender, deathCertCid);
    }

    function confirmDeath(
        uint256 id,
        string[] memory encryptedCidsForHeirs
    ) external onlyNotary testamentExists(id) {
        require(testaments[id].assignedNotary == msg.sender, "Not your testament");
        require(testaments[id].status == Status.DeathReported, "Death not reported");
        require(
            encryptedCidsForHeirs.length == testamentHeirs[id].length,
            "CIDs mismatch"
        );
        testaments[id].status = Status.Executed;
        testaments[id].updatedAt = block.timestamp;
        for (uint256 i = 0; i < testamentHeirs[id].length; i++) {
            testamentHeirs[id][i].encryptedCid = encryptedCidsForHeirs[i];
            testamentHeirs[id][i].canAccess = true;
            emit HeirAccessGranted(id, testamentHeirs[id][i].walletAddress, encryptedCidsForHeirs[i]);
        }
        emit DeathConfirmed(id, msg.sender);
    }

    // ============ VIEW FUNCTIONS ============
    function getNotaries() external view returns (address[] memory) {
        return notaryList;
    }

    function getNotaryInfo(address notaryAddr) external view returns (NotaryInfo memory) {
        return notaries[notaryAddr];
    }

    function getTestament(uint256 id) external view returns (Testament memory) {
        return testaments[id];
    }

    function getTestamentHeirs(uint256 id) external view returns (Heir[] memory) {
        return testamentHeirs[id];
    }

    function getTestatorTestaments(address testator) external view returns (uint256[] memory) {
        return testatorTestaments[testator];
    }

    function getNotaryTestaments(address notary) external view returns (uint256[] memory) {
        return notaryTestaments[notary];
    }

    function getHeirTestaments(address heir) external view returns (uint256[] memory) {
        return heirTestaments[heir];
    }

    function getUserInfo(address wallet) external view returns (UserInfo memory) {
        return users[wallet];
    }

    function getMyRole() external view returns (Role) {
        if (msg.sender == admin) return Role.Admin;
        return users[msg.sender].role;
    }
}