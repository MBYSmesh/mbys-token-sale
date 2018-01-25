pragma solidity 0.4.18;

import './MBYSToken.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';
import 'zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol';

contract MBYSCrowdsale is CappedCrowdsale, FinalizableCrowdsale {
    using SafeMath for uint256;

    uint256 public saleCap = 70000 ether;
    // controller is assigned ownership of token contract after sale concludes
    address public controller;

    function MBYSCrowdsale(uint256 _startTime, uint256 _endTime, address _wallet, address _controller) public
        CappedCrowdsale(saleCap)
        Crowdsale(_startTime, _endTime, 1000, _wallet) // 3rd paramater, rate, is a dummy value; we use tiers instead
    {
        controller = _controller;
    }

    function createTokenContract() internal returns (MintableToken) {
      return new MBYSToken();
    }

    // sell 1000 nominal tokens per eth (1000 * 10 ^ 18)?
    // total number of tokens:

    // Sale bonus structure
    // 0 - 5000, 40%
    // 5000 - 10000, 25%
    // 10000 - 30000, 10%
    // 30000 - 70000, 0%
    uint256[6] public tierAmountCaps =  [ 5000 ether
                                        , 10000 ether
                                        , 30000 ether
                                        , saleCap
                                        ];
    uint256[6] public tierRates = [ 1400
                                  , 1250
                                  , 1100
                                  , 1000
                                  ];

    function tierIndexByWeiAmount(uint256 weiLevel) public constant returns (uint256) {
        require(weiLevel <= saleCap);
        for (uint256 i = 0; i < tierAmountCaps.length; i++) {
            if (weiLevel <= tierAmountCaps[i]) {
                return i;
            }
        }
    }

    /**
     * @dev Calculates how many tokens a given amount of wei can buy at
     * a particular level of weiRaised. Takes into account tiers of purchase
     * bonus
     */
    function calculateTokens(uint256 _amountWei, uint256 _weiRaised) public constant returns (uint256) {
        uint256 currentTier = tierIndexByWeiAmount(_weiRaised);
        uint256 startWeiLevel = _weiRaised;
        uint256 endWeiLevel = _amountWei.add(_weiRaised);
        uint256 tokens = 0;
        for (uint256 i = currentTier; i < tierAmountCaps.length; i++) {
            if (endWeiLevel <= tierAmountCaps[i]) {
                tokens = tokens.add((endWeiLevel.sub(startWeiLevel)).mul(tierRates[i]));
                break;
            } else {
                tokens = tokens.add((tierAmountCaps[i].sub(startWeiLevel)).mul(tierRates[i]));
                startWeiLevel = tierAmountCaps[i];
            }
        }
        return tokens;
    }


    function buyTokens(address beneficiary) public payable {
        uint256 weiAmount = msg.value;

        require(beneficiary != 0x0);
        require(validPurchase());

        uint256 tokens = calculateTokens(weiAmount, weiRaised);
        weiRaised = weiRaised.add(weiAmount);
        token.mint(beneficiary, tokens);
        TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);
        forwardFunds();
    }

    /**
     * @dev Overriden to add finalization logic.
     * Indicates to MBYSToken contract that the sale is over and that the token
     * is now able to be transferred.
     * Transfers ownership of the token from the crowdsale contract to the 'controller'
     * who may, after 'finalization' is called, continue to mint tokens.
     */
    function finalization() internal {
        MBYSToken(token).endSale();
        MBYSToken(token).transferOwnership(controller);
        super.finalization();
    }
}
