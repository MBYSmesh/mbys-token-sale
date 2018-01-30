# MBYS crowdsale contracts

## Crowdsale functionality

- A maximum of 70000 ether-worth of `MBYSToken`s will be sold during the
    crowdsale.
- `MBYSToken`s will be sold in four sale tiers: 0 - 5000 eth, 40% bonus;
    5000 - 10000, 25% bonus; 10000 - 30000, 10% bonus; 30000 - 70000, 0% bonus.
- 1000 nominal (10^8 actual tokens considering the token decimal) `MBYSToken`s
    will be sold for every eth recieved.
- a `controller` will be given ownership of the token contract after the sale
    concludes. The `controller` will mint tokens into pre-sale investors'
    wallets after the crowdsale.

## Token functionality

- `MBYSToken` is created by `MBYSCrowdsale` in `MBYSCrowdsale`'s constructor.
- `MBYSToken` is only mintable by `MBYSCrowdsale` until the end of the
    crowdsale. After the crowdsale concludes, ownership of the token is
    transferred to the `controller` indicated in MBYSCrowdsale's contstructor.
- Because `finishMinting` is never called by the crowdsale, there is an
    unlimited number of tokens that could potentially be produced.
- The `MBYSToken`s minted during the crowdsale will not be transferrable until
    after then end of the sale.
- There will be a maximum of 75,250,000 `MBYSToken`s minted during the
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

Deployment gas consumption: 3135967

```
npm run localdeploy
```

The script run by the command above will `wait` until interrupted. This gives
users the opportunity to interact with the contracts using ganache-cli on port 8545.
