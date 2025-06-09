// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestPaymentToken
 * @author mafa
 * @notice A simple ERC20 token used for testing the NFTMarketplace contract
 * @dev
 * - Compliant with the ERC20 standard
 * - Includes a mint function callable only by the owner
 */

contract TestPaymentToken is ERC20,Ownable{
     constructor(uint256 initialSupply) ERC20("Payment Token", "PT") Ownable(msg.sender){
        _mint(msg.sender, initialSupply);
     }

     function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
     }
}