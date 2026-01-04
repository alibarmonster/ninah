// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ISP1Verifier} from "@sp1-contracts/ISP1Verifier.sol";

/// @title MockSP1Verifier
/// @notice Mock SP1 Verifier for testing - always returns success
/// @dev This mock verifier bypasses real ZK proof verification for development/testing
contract MockSP1Verifier is ISP1Verifier {
    bool public shouldRevert;

    /// @notice Set whether verification should fail
    /// @param _shouldRevert If true, verification will revert
    function setShouldRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }

    /// @notice Mock verification - always succeeds unless shouldRevert is true
    /// @dev Parameters are ignored, just checks shouldRevert flag
    function verifyProof(
        bytes32, /* programVKey */
        bytes calldata, /* publicValues */
        bytes calldata /* proofBytes */
    ) external view {
        if (shouldRevert) {
            revert("Mock verification failed");
        }
        // Success - do nothing (proof is always valid in mock)
    }
}
