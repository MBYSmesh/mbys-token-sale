#!/usr/bin/env bash

function cleanup {
    kill -9 $ganache_pid
}

trap cleanup EXIT

echo "Running MBYS Crowdsale tests..."

ganache-cli --port 8546 --accounts 6 --defaultBalanceEther 2000000000 > /dev/null &

ganache_pid=$!
echo "Started ganache, pid ${ganache_pid}"
truffle test --network ganache test/MBYSCrowdsale.js
