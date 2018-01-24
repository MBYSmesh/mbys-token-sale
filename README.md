# MBYS crowdsale contracts

## questions

- sale start / endtime / duration?

- how will tokens be issues to presale participants?
    + ok if custom minting can only take place after sale?

- happy with total number of tokens?
    + nominal: 75,250,000
    + technical: nominal * 10 ^ 18

## Crowdsale functionality

- A maximum of 70000 ether-worth of `MBYSToken`s will be sold during the
    crowdsale.
- `MBYSToken`s will be sold in four sale tiers: 0 - 5000 eth, 40% bonus;
    5000 - 10000, 25% bonus; 10000 - 30000, 10% bonus; 30000 - 70000, 0% bonus.
- 1000 nominal (10^8 actual tokens considering the token decimal) `MBYSToken`s
    will be sold for every eth recieved.

## Token functionality

- `MBYSToken` is created by `MBYSCrowdsale` in `MBYSCrowdsale`'s constructor.
- `MBYSToken` is only mintable by `MBYSCrowdsale` until the end of the
    crowdsale. After the crowdsale concludes, ownership of the token is
    transferred to the `controller` indicated in MBYSCrowdsale's contstructor.
- Because `finishMinting` is never called by the crowdsale, there is an
    unlimited number of tokens that could potentially be produced.
- The `MBYSToken`s minted during the crowdsale will not be transferrable until
    after then end of the sale.
- There will be a maximum of TODOTODO `MBYSToken`s minted during the
    crowdsale.

## Building contracts

```
npm run compile
```

## Testing contracts

```
npm run test
```

## Deployment guide
