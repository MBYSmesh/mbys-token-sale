"use strict";

const BigNumber = web3.BigNumber;

const help = require("./helpers");

const should = require('chai')
          .use(require('chai-as-promised'))
          .use(require('chai-bignumber')(BigNumber))
          .should();

const MBYSCrowdsale = artifacts.require('./MBYSCrowdsale.sol');
const MBYSToken = artifacts.require("./MBYSToken.sol");

const tiers = [
    { amountCap: help.etherToWei(5000),  rate: web3.toBigNumber(1400) },
    { amountCap: help.etherToWei(10000), rate: web3.toBigNumber(1250) },
    { amountCap: help.etherToWei(30000), rate: web3.toBigNumber(1100) },
    { amountCap: help.etherToWei(70000), rate: web3.toBigNumber(1000) },
];

contract('MBYSCrowdsale', function([owner, controller, user1, user2, investor1, investor2, outsider]) {

    beforeEach(async function() {
        this.startTime    = help.latestTime() + help.duration.weeks(1);
        this.endTime      = this.startTime + help.duration.weeks(4);
        this.afterEndTime = this.endTime + help.duration.seconds(1);

        this.setTimeToSalePeriod = async function() {
            await help.increaseTimeTo(this.startTime + help.duration.hours(1));
        }

        this.setTimeToPostSalePeriod = async function() {
            await help.increaseTimeTo(this.afterEndTime);
        }


        // deploy contracts
        this.crowdsale = await MBYSCrowdsale.new(this.startTime, this.endTime, controller, controller, {from: owner});
        this.token  = MBYSToken.at(await this.crowdsale.token());

    });

    describe("calculateTokens and tierIndexByWeiAmount", function() {

        it("tierIndexByWeiAmount produces the correct tier values", async function() {
            const r1 = await this.crowdsale.tierIndexByWeiAmount(0, {from: user1}).should.be.fulfilled;
            r1.should.be.bignumber.equal(web3.toBigNumber(0));

            const r2 = await this.crowdsale.tierIndexByWeiAmount(0, {from: user1}).should.be.fulfilled;
            r2.should.be.bignumber.equal(web3.toBigNumber(0));

            const r3 = await this.crowdsale.tierIndexByWeiAmount(help.etherToWei(1), {from: user1}).should.be.fulfilled;
            r3.should.be.bignumber.equal(web3.toBigNumber(0));

            const r4 = await this.crowdsale.tierIndexByWeiAmount(help.etherToWei(1000), {from: user1}).should.be.fulfilled;
            r4.should.be.bignumber.equal(web3.toBigNumber(0));

            const r5 = await this.crowdsale.tierIndexByWeiAmount(help.etherToWei(1).add(tiers[0].amountCap), {from: user1}).should.be.fulfilled;
            r5.should.be.bignumber.equal(web3.toBigNumber(1));

            const r6 = await this.crowdsale.tierIndexByWeiAmount(tiers[3].amountCap, {from: user1}).should.be.fulfilled;
            r6.should.be.bignumber.equal(web3.toBigNumber(3));

            await this.crowdsale.tierIndexByWeiAmount(tiers[3].amountCap.add(help.etherToWei(1)), {from: user1}).should.be.rejectedWith(help.EVMRevert);
        });


        it("calculateTokens produces the correct token amounts", async function() {
            // 1 * 1400 = 1400
            const t0 = await this.crowdsale.calculateTokens(help.etherToWei(1), 0, {from: user1}).should.be.fulfilled;
            t0.should.be.bignumber.equal(help.etherToWei(1400));

            // 5000 * 1400 + 1000 * 1250 = 8250000
            const t1 = await this.crowdsale.calculateTokens(help.etherToWei(6000), 0, {from: user1}).should.be.fulfilled;
            t1.should.be.bignumber.equal(help.etherToWei(8250000));
        });

    });

    describe("Before sale period", function() {

            it("Initial supply of zero tokens", async function() {
                const initialSupply = web3.toBigNumber(await this.token.totalSupply());
                initialSupply.should.be.bignumber.equal(0);
            });

            it("Rejects token buys before start of sale", async function() {
                await this.crowdsale.buyTokens(user1, {from: user1, value: 1}).should.be.rejectedWith(help.EVMRevert);
            });

    });


    describe("Sale period", function() {
        beforeEach(async function() {
            await this.setTimeToSalePeriod();
        });

        it("Allows non-beneficiary to buy for beneficiary", async function() {
            await this.crowdsale.buyTokens(user1, {from: user2, value: help.etherToWei(1)}).should.be.fulfilled;
        });

        it("Buy cap results in proper amount of tokens created", async function() {
            const weiRaised = web3.toBigNumber(await this.crowdsale.weiRaised());
            const cap = web3.toBigNumber(await this.crowdsale.cap());
            await this.crowdsale.buyTokens(user1, {from: user1, value: cap.sub(weiRaised)}).should.be.fulfilled;
            const saleOver = await this.crowdsale.hasEnded({from: user1});
            await this.token.endSale({from: owner}).should.be.rejectedWith(help.EVMRevert);
            await this.crowdsale.finalize({from: owner}).should.be.fulfilled;

            const totalSupply = web3.toBigNumber((await this.token.totalSupply()).valueOf());
            totalSupply.should.be.bignumber.equal(help.etherToWei(75250000));

            const transferableTokens = await this.token.transferableTokens(user1, 0);
            transferableTokens.should.be.bignumber.equal(totalSupply);

            // user1 can transfer his purchased tokens after the sale
            await this.token.transfer(user2, help.etherToWei(1), {from: user1}).should.be.fulfilled;
        });

        it("Tokens are not transferable during sale", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: help.etherToWei(10)}).should.be.fulfilled;

            // user1 has a transferable allowance equal to zero
            const transferableTokens = await this.token.transferableTokens(user1, 0);
            transferableTokens.should.be.bignumber.equal(0);


            // user1 fails to transfer his purchased tokens during the sale
            await this.token.transfer(user2, help.etherToWei(1), {from: user1}).should.be.rejectedWith(help.EVMRevert);
        });

        it("Sale can end and tokens are transferable after sale period is over", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: help.etherToWei(10)}).should.be.fulfilled;

            // time elapses and the sale ends
            await this.setTimeToPostSalePeriod();
            await this.crowdsale.finalize({from: owner}).should.be.fulfilled;

            // user1 has a transferable allowance equal to zero
            const transferableTokens = await this.token.transferableTokens(user1, 0);
            transferableTokens.should.be.bignumber.gt(0);

            // user1 fails to transfer his purchased tokens during the sale
            await this.token.transfer(user2, help.etherToWei(1), {from: user1}).should.be.fulfilled;
        });

    });

    describe("After sale period", function() {

        beforeEach(async function() {
            await this.setTimeToSalePeriod();
            const cap = web3.toBigNumber(await this.crowdsale.cap());
            await this.crowdsale.buyTokens(user1, {from: user1, value: cap}).should.be.fulfilled;
            await this.crowdsale.finalize({from: owner}).should.be.fulfilled;
        });

        it("Does not allow further buys after end of sale", async function() {
            await this.crowdsale.buyTokens(user1, {from: user1, value: help.etherToWei(4000)}).should.be.rejectedWith(help.EVMRevert);
        });


        it("Controller can mint tokens to presale investors' wallets after sale ends", async function() {
            // mints 350000 nominal tokens to `investor1`'s token wallet
            await this.token.mint(investor1, help.etherToWei(350000), {from: controller}).should.be.fulfilled;
            // mints 50000 nominal tokens to `investor2`'s token wallet
            await this.token.mint(investor2, help.etherToWei(50000), {from: controller}).should.be.fulfilled;

            // owner fails to mint tokens
            await this.token.mint(owner, help.etherToWei(50000), {from: owner}).should.be.rejectedWith(help.EVMRevert);
            // outsider fails to mint tokens
            await this.token.mint(outsider, help.etherToWei(50000), {from: outsider}).should.be.rejectedWith(help.EVMRevert);
        });

    });
});
