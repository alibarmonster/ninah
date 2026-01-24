// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.23;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IMockIDRX} from "./IMockIDRX.sol";
import {ISP1Verifier} from "@sp1-contracts/ISP1Verifier.sol";

/// @title NinjaRupiah
/// @notice Privacy-preserving payment system with stealth addresses and ZK proofs
/// @dev Uses MockSP1Verifier for mock proof verification in development
contract MockNinjaRupiah is ReentrancyGuard, Ownable {
    IMockIDRX public immutable idrx;

    address public sp1Verifier;

    // Base Sepolia V5.0.0 Groth16 verifier (for reference, mock uses MockSP1Verifier)
    address public constant BASE_SEPOLIA_SP1_VERIFIER =
        0x50ACFBEdecf4cbe350E1a86fC6f03a821772f1e5;

    uint256 public constant MAX_USERNAME_LENGTH = 32;

    // Privacy: Store only username hash, not plaintext
    mapping(bytes32 => bytes32) public usernameCommitments; // usernameHash => commitment

    mapping(address => bytes32) public addressToUsernameHash; // address => usernameHash

    mapping(bytes32 => bool) public usernameHashExists; // usernameHash => exists

    mapping(address => StealthPayment) public stealthPayments;

    mapping(address => MetaKeys) public userMetaKeys;

    struct StealthPayment {
        uint256 amount;
        bytes32 ephemeralPubkey;
        address sender;
        uint256 timestamp;
        bool claimed;
    }

    struct MetaKeys {
        bytes metaViewingPub;
        bytes metaSpendingPub;
        bool registered;
    }

    // Privacy: Event emits usernameHash instead of plaintext username
    event UsernameRegistered(
        bytes32 indexed usernameHash,
        address indexed user,
        bytes32 commitment
    );

    event MetaKeysRegistered(
        address indexed user,
        bytes metaViewingPub,
        bytes metaSpendingPub
    );

    event StealthPaymentSent(
        address indexed stealthAddress,
        address indexed sender,
        uint256 amount,
        bytes32 ephemeralPubkeyHash
    );

    event StealthPaymentClaimed(
        address indexed stealthAddress,
        address indexed claimer,
        uint256 amount
    );

    event SP1VerifierUpdated(
        address indexed oldVerifier,
        address indexed newVerifier
    );

    error UsernameAlreadyTaken();
    error UsernameNotRegistered();
    error InvalidCommitment();
    error InvalidProof();
    error MetaKeysNotRegistered();
    error StealthPaymentNotFound();
    error StealthPaymentAlreadyClaimed();
    error InsufficientBalance();
    error TransferFailed();
    error Unauthorized();
    error UserAlreadyHasUsername();
    error PaymentAlreadyExists();
    error MetaKeysAlreadyRegistered();

    constructor(address _idrx, address _sp1Verifier) Ownable(msg.sender) {
        require(_idrx != address(0), "Invalid IDRX address");
        require(_sp1Verifier != address(0), "Invalid verifier address");

        idrx = IMockIDRX(_idrx);
        sp1Verifier = _sp1Verifier;
    }

    /// @notice Register a username with ZK proof (privacy-preserving)
    /// @dev In mock mode, the MockSP1Verifier always returns success
    /// @param usernameHash keccak256 hash of the username (from ZK public values)
    /// @param commitment The commitment hash linking username, wallet, and secret
    /// @param proof The SP1 ZK proof: abi.encode(vkeyHash, publicValues, proofBytes)
    function RegisterUsername(
        bytes32 usernameHash,
        bytes32 commitment,
        bytes calldata proof
    ) external {
        // Check if username hash is already taken
        if (usernameHashExists[usernameHash]) revert UsernameAlreadyTaken();

        // Check if user already has a username
        if (addressToUsernameHash[msg.sender] != bytes32(0)) {
            revert UserAlreadyHasUsername();
        }

        // Verify ZK proof - MockSP1Verifier always returns true
        if (!verifyUsernameProof(usernameHash, commitment, proof)) {
            revert InvalidProof();
        }

        usernameCommitments[usernameHash] = commitment;
        addressToUsernameHash[msg.sender] = usernameHash;
        usernameHashExists[usernameHash] = true;

        emit UsernameRegistered(usernameHash, msg.sender, commitment);
    }

    function registerMetaKeys(
        bytes calldata metaViewingPub,
        bytes calldata metaSpendingPub
    ) external {
        require(metaViewingPub.length == 33, "Invalid viewing key length");
        require(metaSpendingPub.length == 33, "Invalid spending key length");

        // Prevent overwriting existing keys
        if (userMetaKeys[msg.sender].registered) {
            revert MetaKeysAlreadyRegistered();
        }

        userMetaKeys[msg.sender] = MetaKeys({
            metaViewingPub: metaViewingPub,
            metaSpendingPub: metaSpendingPub,
            registered: true
        });

        emit MetaKeysRegistered(msg.sender, metaViewingPub, metaSpendingPub);
    }

    function sendToStealth(
        address stealthAddress,
        uint256 amount,
        bytes calldata ephemeralPubkey
    ) external nonReentrant {
        require(ephemeralPubkey.length == 33, "Invalid ephemeral key length");
        require(amount > 0, "Amount must be > 0");

        // Prevent overwriting existing payments
        if (stealthPayments[stealthAddress].amount != 0) {
            revert PaymentAlreadyExists();
        }

        // Transfer tokens directly to stealth address
        bool success = idrx.transferFrom(msg.sender, stealthAddress, amount);
        if (!success) revert TransferFailed();

        bytes32 ephemeralPubkeyHash = keccak256(ephemeralPubkey);

        stealthPayments[stealthAddress] = StealthPayment({
            amount: amount,
            ephemeralPubkey: ephemeralPubkeyHash,
            sender: msg.sender,
            timestamp: block.timestamp,
            claimed: false
        });

        emit StealthPaymentSent(
            stealthAddress,
            msg.sender,
            amount,
            ephemeralPubkeyHash
        );
    }

    /// @notice Claim funds from a stealth address with ZK proof
    /// @dev In mock mode, the MockSP1Verifier always returns success
    function claimFromStealth(
        address stealthAddress,
        bytes calldata proof
    ) external nonReentrant {
        StealthPayment storage payment = stealthPayments[stealthAddress];

        if (payment.amount == 0) revert StealthPaymentNotFound();
        if (payment.claimed) revert StealthPaymentAlreadyClaimed();

        // MockSP1Verifier always returns true
        if (
            !verifyClaimingProof(
                stealthAddress,
                msg.sender,
                payment.ephemeralPubkey,
                proof
            )
        ) {
            revert InvalidProof();
        }

        payment.claimed = true;

        bool success = idrx.transfer(msg.sender, payment.amount);
        if (!success) revert TransferFailed();

        emit StealthPaymentClaimed(stealthAddress, msg.sender, payment.amount);
    }

    function getMetaKeys(address user) external view returns (MetaKeys memory) {
        return userMetaKeys[user];
    }

    function getStealthPayment(
        address stealthAddress
    ) external view returns (StealthPayment memory) {
        return stealthPayments[stealthAddress];
    }

    /// @notice Get username hash for a user
    function getUsernameHash(address user) external view returns (bytes32) {
        return addressToUsernameHash[user];
    }

    /// @notice Check if a username is available (pass keccak256(username))
    function isUsernameHashAvailable(
        bytes32 usernameHash
    ) external view returns (bool) {
        return !usernameHashExists[usernameHash];
    }

    function updateSP1Verifier(address newVerifier) external onlyOwner {
        require(newVerifier != address(0), "Invalid verifier address");

        address oldVerifier = sp1Verifier;
        sp1Verifier = newVerifier;

        emit SP1VerifierUpdated(oldVerifier, newVerifier);
    }

    /// @notice Verify username commitment proof using SP1 zkVM (Mock version)
    /// @dev MockSP1Verifier always succeeds, so this just validates public values match
    function verifyUsernameProof(
        bytes32 usernameHash,
        bytes32 commitment,
        bytes calldata proof
    ) internal view returns (bool) {
        // Decode proof data
        (
            bytes32 vkeyHash,
            bytes memory publicValues,
            bytes memory proofBytes
        ) = abi.decode(proof, (bytes32, bytes, bytes));

        // Verify the proof via SP1 verifier (MockSP1Verifier always succeeds)
        try
            ISP1Verifier(sp1Verifier).verifyProof(
                vkeyHash,
                publicValues,
                proofBytes
            )
        {
            // Proof verification succeeded, now validate public values

            // Decode public values: (bytes32 username_hash, bytes32 commitment_from_proof)
            (bytes32 usernameHashFromProof, bytes32 commitmentFromProof) = abi
                .decode(publicValues, (bytes32, bytes32));

            // Verify username hash matches
            if (usernameHashFromProof != usernameHash) {
                return false;
            }

            // Verify commitment matches
            if (commitmentFromProof != commitment) {
                return false;
            }

            return true;
        } catch {
            // Proof verification failed
            return false;
        }
    }

    /// @notice Verify claiming proof for stealth address using SP1 zkVM (Mock version)
    /// @dev MockSP1Verifier always succeeds, so this just validates public values match
    function verifyClaimingProof(
        address stealthAddress,
        address claimer,
        bytes32 ephemeralPubkeyHash,
        bytes calldata proof
    ) internal view returns (bool) {
        // Decode proof data
        (
            bytes32 vkeyHash,
            bytes memory publicValues,
            bytes memory proofBytes
        ) = abi.decode(proof, (bytes32, bytes, bytes));

        // Verify the proof via SP1 verifier (MockSP1Verifier always succeeds)
        try
            ISP1Verifier(sp1Verifier).verifyProof(
                vkeyHash,
                publicValues,
                proofBytes
            )
        {
            // Proof verification succeeded, now validate public values

            // Decode public values: (address stealth_addr, bytes32 ephemeral_hash, address claimer_addr)
            (
                address stealthAddrFromProof,
                bytes32 ephemeralHashFromProof,
                address claimerFromProof
            ) = abi.decode(publicValues, (address, bytes32, address));

            // Verify stealth address matches
            if (stealthAddrFromProof != stealthAddress) {
                return false;
            }

            // Verify ephemeral pubkey hash matches
            if (ephemeralHashFromProof != ephemeralPubkeyHash) {
                return false;
            }

            // Verify claimer address matches
            if (claimerFromProof != claimer) {
                return false;
            }

            return true;
        } catch {
            // Proof verification failed
            return false;
        }
    }
}
