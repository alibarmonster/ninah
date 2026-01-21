// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @title MockIDRX
/// @notice Mock Indonesian Rupiah stablecoin for testing
/// @dev ERC20 token with 6 decimals and EIP-2612 permit for gasless approvals
contract MockIDRX is ERC20, ERC20Permit, Ownable2Step {
    uint8 private constant DECIMALS = 6;
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 6;
    uint256 public constant MAX_BATCH_SIZE = 100;

    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);

    constructor() ERC20("Mock IDRX", "nIDRX") ERC20Permit("Mock IDRX") Ownable(msg.sender) {}

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "MockIDRX: mint to zero address");
        require(
            totalSupply() + amount <= MAX_SUPPLY,
            "MockIDRX: exceeds max supply"
        );

        _mint(to, amount);
        emit Minted(to, amount);
    }

    function mintBatch(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(
            recipients.length == amounts.length,
            "MockIDRX: length mismatch"
        );
        require(
            recipients.length > 0 && recipients.length <= MAX_BATCH_SIZE,
            "MockIDRX: invalid batch size"
        );

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "MockIDRX: zero address");
            totalAmount += amounts[i];
        }

        require(
            totalSupply() + totalAmount <= MAX_SUPPLY,
            "MockIDRX: exceeds max supply"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
            emit Minted(recipients[i], amounts[i]);
        }
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount);
    }

    /// @notice Admin-controlled burn for compliance, sanctions, or emergency situations
    /// @dev Owner can burn tokens from any address without allowance. Use with extreme caution.
    /// @param from The address to burn tokens from
    /// @param amount The amount of tokens to burn
    function adminBurn(address from, uint256 amount) external onlyOwner {
        require(from != address(0), "MockIDRX: burn from zero address");
        _burn(from, amount);
        emit Burned(from, amount);
    }

    function balanceOfHuman(address account) external view returns (uint256) {
        return balanceOf(account) / 10 ** DECIMALS;
    }

    function toTokenAmount(
        uint256 humanAmount
    ) external pure returns (uint256) {
        return humanAmount * 10 ** DECIMALS;
    }

    function toHumanAmount(
        uint256 tokenAmount
    ) external pure returns (uint256) {
        return tokenAmount / 10 ** DECIMALS;
    }
}
