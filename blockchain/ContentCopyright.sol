// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ContentRegistry
 * @notice Blockchain-based content copyright registration system.
 *         Stores content fingerprints as proof of ownership with timestamps.
 *         Designed for deployment on Sepolia testnet via Remix IDE.
 */
contract ContentRegistry {

    struct ContentRecord {
        address owner;
        string contentType;   // "text" or "image"
        string fingerprint;
        string title;
        string description;
        uint256 timestamp;
        bool exists;
    }

    // fingerprint => record
    mapping(string => ContentRecord) private records;

    // all registered fingerprints (for enumeration)
    string[] public allFingerprints;

    // owner => list of fingerprints they registered
    mapping(address => string[]) private ownerRecords;

    event ContentRegistered(
        address indexed owner,
        string fingerprint,
        string contentType,
        string title,
        uint256 timestamp
    );

    /**
     * @notice Register a new piece of content on-chain.
     * @param _fingerprint SHA-256 hex hash of the content
     * @param _contentType "text" or "image"
     * @param _title Short title (max 100 chars)
     * @param _description Brief description (max 200 chars)
     */
    function registerContent(
        string calldata _fingerprint,
        string calldata _contentType,
        string calldata _title,
        string calldata _description
    ) external {
        require(bytes(_fingerprint).length > 0, "Fingerprint cannot be empty");
        require(bytes(_fingerprint).length <= 128, "Fingerprint too long");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_title).length <= 100, "Title too long (max 100 chars)");
        require(bytes(_description).length <= 200, "Description too long (max 200 chars)");
        require(!records[_fingerprint].exists, "Content already registered");

        // Validate content type
        require(
            keccak256(bytes(_contentType)) == keccak256(bytes("text")) ||
            keccak256(bytes(_contentType)) == keccak256(bytes("image")),
            "Content type must be 'text' or 'image'"
        );

        ContentRecord memory newRecord = ContentRecord({
            owner: msg.sender,
            contentType: _contentType,
            fingerprint: _fingerprint,
            title: _title,
            description: _description,
            timestamp: block.timestamp,
            exists: true
        });

        records[_fingerprint] = newRecord;
        allFingerprints.push(_fingerprint);
        ownerRecords[msg.sender].push(_fingerprint);

        emit ContentRegistered(
            msg.sender,
            _fingerprint,
            _contentType,
            _title,
            block.timestamp
        );
    }

    /**
     * @notice Get a content record by its fingerprint.
     */
    function getRecord(string calldata _fingerprint)
        external
        view
        returns (
            address owner,
            string memory contentType,
            string memory title,
            string memory description,
            uint256 timestamp,
            bool exists
        )
    {
        ContentRecord storage r = records[_fingerprint];
        return (r.owner, r.contentType, r.title, r.description, r.timestamp, r.exists);
    }

    /**
     * @notice Get total number of registered content items.
     */
    function getRecordCount() external view returns (uint256) {
        return allFingerprints.length;
    }

    /**
     * @notice Get all fingerprints registered by a specific owner.
     */
    function getOwnerRecords(address _owner)
        external
        view
        returns (string[] memory)
    {
        return ownerRecords[_owner];
    }

    /**
     * @notice Verify if a specific address owns the content with the given fingerprint.
     */
    function verifyOwnership(string calldata _fingerprint, address _claimedOwner)
        external
        view
        returns (bool)
    {
        ContentRecord storage r = records[_fingerprint];
        return r.exists && r.owner == _claimedOwner;
    }

    /**
     * @notice Get a fingerprint by its index in the allFingerprints array.
     */
    function getFingerprintAtIndex(uint256 _index)
        external
        view
        returns (string memory)
    {
        require(_index < allFingerprints.length, "Index out of bounds");
        return allFingerprints[_index];
    }
}
