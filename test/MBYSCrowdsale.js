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

contract('MBYSCrowdsale', function([owner, controller, user1, user2]) {

    beforeEach(async function() {
        this.startTime    = help.latestTime() + help.duration.weeks(1);
        this.endTime      = this.startTime + help.duration.weeks(4);
        this.afterEndTime = this.endTime + help.duration.seconds(1);

        this.setTimeToSalePeriod = async function() {
            await help.increaseTimeTo(this.startTime + help.duration.hours(1));
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

            await this.crowdsale.tierIndexByWeiAmount(tiers[3].amountCap.add(help.etherToWei(1)), {from: user1}).should.be.rejectedWith(help.EVMThrow);
        });


    });

    describe("Before start", function() {

            it("rejects payment before start", async function() {
                await this.crowdsale.buyTokens(user1, {from: user1, value: 1}).should.be.rejectedWith(help.EVMThrow);
            });

    });


    describe("sale period", function() {
        beforeEach(async function() {
            await this.setTimeToSalePeriod();
        });

        it("allows non-beneficiary to buy for beneficiary", async function() {
            await this.crowdsale.buyTokens(user1, {from: user2, value: help.etherToWei(1)}).should.be.fulfilled;
        });

        it("buy cap results in proper amount of tokens created", async function() {
            const weiRaised = web3.toBigNumber(await this.crowdsale.weiRaised());
            const cap = web3.toBigNumber(await this.crowdsale.cap());
            await this.crowdsale.buyTokens(user1, {from: user1, value: cap.sub(weiRaised)}).should.be.fulfilled;
            const saleOver = await this.crowdsale.hasEnded({from: user1});
            await this.token.endSale({from: owner}).should.be.rejectedWith(help.EVMThrow);
            await this.crowdsale.finalize({from: owner}).should.be.fulfilled;
            const transferableTokens = await this.token.transferableTokens(user1, 0);
            transferableTokens.should.be.bignumber.greaterThan(0);

            const totalSupply = web3.toBigNumber((await this.token.totalSupply()).valueOf());
            totalSupply.should.be.bignumber.equal(help.etherToWei(75250000));
        });

    });

});