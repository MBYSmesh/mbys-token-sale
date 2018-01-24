pragma solidity 0.4.18;

import 'zeppelin-solidity/contracts/token/MintableToken.sol';

contract MBYSToken is MintableToken {

    string public name = "MBYS TOKEN";
    string public symbol = "MBYS";
    uint256 public decimals = 18;

    bool public saleOver = false;

    // set owner besides crowdsale contract
    function MBYSToken() public {
    }

    function endSale() public onlyOwner {
        require (!saleOver);
        saleOver = true;
    }

    /**
     * @dev returns all user's tokens if time >= releaseTime
     */
    function transferableTokens(address holder, uint64) public constant returns (uint256) {
        if (saleOver)
            return balanceOf(holder);
        else
            return 0;
    }

}
