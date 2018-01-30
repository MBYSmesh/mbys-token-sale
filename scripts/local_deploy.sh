#!/usr/bin/env bash

function cleanup {
    kill -9 $ganache_pid
}

trap cleanup EXIT

echo "Running MBYS Crowdsale tests..."

ganache-cli --port 8545 --accounts 9 --defaultBalanceEther 2000000000 &

ganache_pid=$!
echo "Started ganache, pid ${ganache_pid}"
truffle migrate --network localdeploy
wait
