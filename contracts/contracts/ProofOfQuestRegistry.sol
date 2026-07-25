// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Proof of Quest contribution credential registry
/// @notice Issuers create non-transferable credentials for designers and may
/// revoke only credentials they issued. A credential's history is never deleted.
contract ProofOfQuestRegistry {
    struct Credential {
        address issuer;
        address designer;
        bytes32 projectRefHash;
        bytes32 evidenceHash;
        string projectCategory;
        string role;
        string publicSummary;
        uint64 issuedAt;
        uint64 revokedAt;
    }

    error InvalidDesigner();
    error EmptyProjectReference();
    error CredentialNotFound(uint256 credentialId);
    error NotCredentialIssuer(address caller, address issuer);
    error CredentialAlreadyRevoked(uint256 credentialId);
    error TimestampOverflow();

    event CredentialIssued(
        uint256 indexed credentialId,
        address indexed issuer,
        address indexed designer,
        bytes32 projectRefHash,
        bytes32 evidenceHash
    );

    event CredentialRevoked(
        uint256 indexed credentialId,
        address indexed issuer,
        uint64 revokedAt
    );

    uint256 private _nextCredentialId = 1;
    mapping(uint256 credentialId => Credential credential) private _credentials;
    mapping(address designer => uint256[] credentialIds) private _designerCredentials;

    /// @notice Issues an immutable, non-transferable contribution credential.
    /// @return credentialId The newly created credential identifier.
    function issueCredential(
        address designer,
        bytes32 projectRefHash,
        bytes32 evidenceHash,
        string calldata projectCategory,
        string calldata role,
        string calldata publicSummary
    ) external returns (uint256 credentialId) {
        if (designer == address(0)) revert InvalidDesigner();
        if (projectRefHash == bytes32(0)) revert EmptyProjectReference();
        if (block.timestamp > type(uint64).max) revert TimestampOverflow();

        credentialId = _nextCredentialId++;
        _credentials[credentialId] = Credential({
            issuer: msg.sender,
            designer: designer,
            projectRefHash: projectRefHash,
            evidenceHash: evidenceHash,
            projectCategory: projectCategory,
            role: role,
            publicSummary: publicSummary,
            issuedAt: uint64(block.timestamp),
            revokedAt: 0
        });
        _designerCredentials[designer].push(credentialId);

        emit CredentialIssued(
            credentialId,
            msg.sender,
            designer,
            projectRefHash,
            evidenceHash
        );
    }

    /// @notice Revokes a credential while preserving its original data.
    function revokeCredential(uint256 credentialId) external {
        Credential storage credential = _requireCredential(credentialId);
        if (msg.sender != credential.issuer) {
            revert NotCredentialIssuer(msg.sender, credential.issuer);
        }
        if (credential.revokedAt != 0) {
            revert CredentialAlreadyRevoked(credentialId);
        }
        if (block.timestamp > type(uint64).max) revert TimestampOverflow();

        credential.revokedAt = uint64(block.timestamp);
        emit CredentialRevoked(credentialId, msg.sender, credential.revokedAt);
    }

    function getCredential(
        uint256 credentialId
    ) external view returns (Credential memory) {
        Credential storage credential = _requireCredential(credentialId);
        return credential;
    }

    function getDesignerCredentials(
        address designer
    ) external view returns (uint256[] memory) {
        return _designerCredentials[designer];
    }

    function isCredentialValid(uint256 credentialId) external view returns (bool) {
        return _requireCredential(credentialId).revokedAt == 0;
    }

    function credentialCount() external view returns (uint256) {
        return _nextCredentialId - 1;
    }

    function _requireCredential(
        uint256 credentialId
    ) private view returns (Credential storage credential) {
        credential = _credentials[credentialId];
        if (credential.issuer == address(0)) {
            revert CredentialNotFound(credentialId);
        }
    }
}
