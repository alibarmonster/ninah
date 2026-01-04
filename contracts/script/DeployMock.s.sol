// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {MockIDRX} from "../src/MockIDRX.sol";
import {MockSP1Verifier} from "../src/MockSP1Verifier.sol";
import {NinjaRupiah} from "../src/NinjaRupiah.sol";

/// @title DeployMock
/// @notice Deployment script for Mock NinjaRupiah with MockSP1Verifier
/// @dev Deploys all contracts needed for testing without real ZK proofs
contract DeployMock is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Mock NinjaRupiah contracts...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockIDRX token
        MockIDRX mockIDRX = new MockIDRX();
        console.log("MockIDRX deployed at:", address(mockIDRX));

        // 2. Deploy MockSP1Verifier (always returns success)
        MockSP1Verifier mockVerifier = new MockSP1Verifier();
        console.log("MockSP1Verifier deployed at:", address(mockVerifier));

        // 3. Deploy NinjaRupiah with mock verifier
        NinjaRupiah ninjaRupiah = new NinjaRupiah(address(mockIDRX), address(mockVerifier));
        console.log("NinjaRupiah deployed at:", address(ninjaRupiah));

        // 4. Mint some tokens to deployer for testing
        uint256 mintAmount = 1_000_000 * 10 ** 6; // 1 million IDRX
        mockIDRX.mint(deployer, mintAmount);
        console.log("Minted", mintAmount / 10 ** 6, "IDRX to deployer");

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("MockIDRX:", address(mockIDRX));
        console.log("MockSP1Verifier:", address(mockVerifier));
        console.log("NinjaRupiah:", address(ninjaRupiah));
    }
}
