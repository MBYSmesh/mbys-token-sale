pragma solidity 0.4.18;

import 'zeppelin-solidity/contracts/token/MintableToken.sol';
import './LimitedTransferToken.sol';

contract MBYSToken is MintableToken, LimitedTransferToken {

    string public name = "MBYS TOKEN";
    string public symbol = "MBYS";
    uint256 public decimals = 18;

    bool public saleOver = false;

    function MBYSToken() public {
    }

    function endSale() public onlyOwner {
        require (!saleOver);
        saleOver = true;
    }

    /**
     * @dev returns all user's tokens after sale is over, 0 otherwise
     */
    function transferableTokens(address holder, uint64) public constant returns (uint256) {
        if (saleOver)
            return balanceOf(holder);
        else
            return 0;
    }

}
