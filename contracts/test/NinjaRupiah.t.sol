// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {MockIDRX} from "../src/MockIDRX.sol";
import {MockSP1Verifier} from "../src/MockSP1Verifier.sol";
import {NinjaRupiah} from "../src/NinjaRupiah.sol";

/// @title NinjaRupiahTest
/// @notice Tests for Mock NinjaRupiah with MockSP1Verifier
contract NinjaRupiahTest is Test {
    MockIDRX public mockIDRX;
    MockSP1Verifier public mockVerifier;
    NinjaRupiah public ninjaRupiah;

    address public owner = address(this);
    address public alice = address(0x1);
    address public bob = address(0x2);

    bytes32 public constant MOCK_VKEY = bytes32(uint256(1));

    function setUp() public {
        // Deploy contracts
        mockIDRX = new MockIDRX();
        mockVerifier = new MockSP1Verifier();
        ninjaRupiah = new NinjaRupiah(address(mockIDRX), address(mockVerifier));

        // Fund test accounts
        mockIDRX.mint(alice, 1_000_000 * 10 ** 6);
        mockIDRX.mint(bob, 1_000_000 * 10 ** 6);
    }

    function testRegisterUsername() public {
        vm.startPrank(alice);

        bytes32 usernameHash = keccak256(bytes("alice"));
        bytes32 commitment = keccak256(abi.encodePacked(usernameHash, alice, bytes32(uint256(12345))));

        // Create mock proof with matching public values
        bytes memory publicValues = abi.encode(usernameHash, commitment);
        bytes memory proofBytes = hex"1234"; // Mock proof bytes
        bytes memory proof = abi.encode(MOCK_VKEY, publicValues, proofBytes);

        ninjaRupiah.RegisterUsername(usernameHash, commitment, proof);

        assertEq(ninjaRupiah.addressToUsernameHash(alice), usernameHash);
        assertTrue(ninjaRupiah.usernameHashExists(usernameHash));

        vm.stopPrank();
    }

    function testRegisterMetaKeys() public {
        vm.startPrank(alice);

        // 33 bytes compressed public key format
        bytes memory viewingPub = abi.encodePacked(bytes1(0x02), bytes32(uint256(1)));
        bytes memory spendingPub = abi.encodePacked(bytes1(0x03), bytes32(uint256(2)));

        ninjaRupiah.registerMetaKeys(viewingPub, spendingPub);

        NinjaRupiah.MetaKeys memory keys = ninjaRupiah.getMetaKeys(alice);
        assertTrue(keys.registered);
        assertEq(keys.metaViewingPub, viewingPub);
        assertEq(keys.metaSpendingPub, spendingPub);

        vm.stopPrank();
    }

    function testSendToStealth() public {
        address stealthAddress = address(0x3);
        uint256 amount = 100 * 10 ** 6; // 100 IDRX

        vm.startPrank(alice);

        // Approve NinjaRupiah to spend IDRX
        mockIDRX.approve(address(ninjaRupiah), amount);

        // 33 bytes compressed public key
        bytes memory ephemeralPubkey = abi.encodePacked(bytes1(0x02), bytes32(uint256(999)));

        ninjaRupiah.sendToStealth(stealthAddress, amount, ephemeralPubkey);

        NinjaRupiah.StealthPayment memory payment = ninjaRupiah.getStealthPayment(stealthAddress);
        assertEq(payment.amount, amount);
        assertEq(payment.sender, alice);
        assertFalse(payment.claimed);

        vm.stopPrank();
    }

    function testClaimFromStealth() public {
        address stealthAddress = address(0x3);
        uint256 amount = 100 * 10 ** 6;

        // Alice sends to stealth
        vm.startPrank(alice);
        mockIDRX.approve(address(ninjaRupiah), amount);
        bytes memory ephemeralPubkey = abi.encodePacked(bytes1(0x02), bytes32(uint256(999)));
        ninjaRupiah.sendToStealth(stealthAddress, amount, ephemeralPubkey);
        vm.stopPrank();

        // Bob claims (with mock proof)
        vm.startPrank(bob);

        bytes32 ephemeralPubkeyHash = keccak256(ephemeralPubkey);
        bytes memory publicValues = abi.encode(stealthAddress, ephemeralPubkeyHash, bob);
        bytes memory proofBytes = hex"5678";
        bytes memory proof = abi.encode(MOCK_VKEY, publicValues, proofBytes);

        uint256 bobBalanceBefore = mockIDRX.balanceOf(bob);
        ninjaRupiah.claimFromStealth(stealthAddress, proof);
        uint256 bobBalanceAfter = mockIDRX.balanceOf(bob);

        assertEq(bobBalanceAfter - bobBalanceBefore, amount);

        NinjaRupiah.StealthPayment memory payment = ninjaRupiah.getStealthPayment(stealthAddress);
        assertTrue(payment.claimed);

        vm.stopPrank();
    }

    function testMockVerifierCanBeSetToRevert() public {
        mockVerifier.setShouldRevert(true);

        vm.startPrank(alice);

        bytes32 usernameHash = keccak256(bytes("alice"));
        bytes32 commitment = keccak256(abi.encodePacked(usernameHash, alice, bytes32(uint256(12345))));
        bytes memory publicValues = abi.encode(usernameHash, commitment);
        bytes memory proof = abi.encode(MOCK_VKEY, publicValues, hex"1234");

        vm.expectRevert(NinjaRupiah.InvalidProof.selector);
        ninjaRupiah.RegisterUsername(usernameHash, commitment, proof);

        vm.stopPrank();
    }
}
