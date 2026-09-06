// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EvidenceRegistry
 * @notice TRACE // VERIFY — On-chain evidence anchoring for digital forensics.
 *
 * This contract stores cryptographic fingerprints (SHA-256 hashes) of discovered
 * content. It does NOT store biometric data, face embeddings, or personal information.
 *
 * Only the content hash, a compact source reference, match score, and timestamp
 * are anchored on-chain, providing tamper-evident provenance for any investigation.
 *
 * Deployed on Polygon Amoy Testnet.
 */
contract EvidenceRegistry {

    // ─────────────────────────────────────────────────────────
    // Data Structures
    // ─────────────────────────────────────────────────────────

    struct EvidenceRecord {
        bytes32     contentHash;       // SHA-256 of discovered content
        string      sourceReference;   // URL or compact metadata (truncated)
        uint256     matchScore;        // Face similarity in basis points (e.g. 9680 = 96.80%)
        uint256     timestamp;         // Block timestamp at recording
        address     recorder;          // Address that submitted the record
        bool        exists;            // Always true once set
        uint256     version;           // Schema version (for future upgrades)
    }

    // ─────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────

    mapping(bytes32 => EvidenceRecord) private _records;
    bytes32[] private _allHashes;

    uint256 public constant VERSION = 1;
    address public immutable owner;
    uint256 public totalRecords;

    // ─────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────

    event EvidenceRecorded(
        bytes32 indexed contentHash,
        address indexed recorder,
        uint256 matchScore,
        uint256 timestamp
    );

    event EvidenceVerified(
        bytes32 indexed contentHash,
        bool exists,
        address verifier
    );

    // ─────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─────────────────────────────────────────────────────────
    // Write: Record Evidence
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Anchor a content fingerprint on-chain.
     * @param contentHash   SHA-256 hash of the discovered content (bytes32).
     * @param sourceReference Truncated URL or compact identifier of the source.
     * @param matchScore    Face similarity score in basis points (0–10000).
     * @return recordIndex  Sequential record index.
     */
    function recordEvidence(
        bytes32 contentHash,
        string calldata sourceReference,
        uint256 matchScore
    ) external returns (uint256 recordIndex) {
        require(contentHash != bytes32(0), "Invalid content hash");
        require(matchScore <= 10000, "Match score must be 0-10000 basis points");
        require(bytes(sourceReference).length <= 500, "Source reference too long");

        EvidenceRecord storage rec = _records[contentHash];

        // Allow re-anchoring if already exists (updates timestamp)
        if (!rec.exists) {
            _allHashes.push(contentHash);
            totalRecords++;
        }

        rec.contentHash = contentHash;
        rec.sourceReference = sourceReference;
        rec.matchScore = matchScore;
        rec.timestamp = block.timestamp;
        rec.recorder = msg.sender;
        rec.exists = true;
        rec.version = VERSION;

        emit EvidenceRecorded(contentHash, msg.sender, matchScore, block.timestamp);
        return totalRecords;
    }

    // ─────────────────────────────────────────────────────────
    // Read: Verify Evidence
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Look up a recorded evidence by its content hash.
     * @param contentHash  SHA-256 hash to query.
     * @return exists          Whether this hash was ever recorded.
     * @return sourceReference The source reference stored at anchoring time.
     * @return matchScore      The face match score (basis points).
     * @return timestamp       The block.timestamp when recorded.
     * @return recorder        The address that submitted the record.
     */
    function verifyEvidence(bytes32 contentHash)
        external
        returns (
            bool   exists,
            string memory sourceReference,
            uint256 matchScore,
            uint256 timestamp,
            address recorder
        )
    {
        EvidenceRecord storage rec = _records[contentHash];

        emit EvidenceVerified(contentHash, rec.exists, msg.sender);

        return (
            rec.exists,
            rec.sourceReference,
            rec.matchScore,
            rec.timestamp,
            rec.recorder
        );
    }

    /**
     * @notice Pure read — does not emit events, cheaper.
     */
    function queryEvidence(bytes32 contentHash)
        external
        view
        returns (
            bool   exists,
            string memory sourceReference,
            uint256 matchScore,
            uint256 timestamp,
            address recorder
        )
    {
        EvidenceRecord storage rec = _records[contentHash];
        return (
            rec.exists,
            rec.sourceReference,
            rec.matchScore,
            rec.timestamp,
            rec.recorder
        );
    }

    /**
     * @notice Return the total number of unique evidence records.
     */
    function getRecordCount() external view returns (uint256) {
        return totalRecords;
    }
}
