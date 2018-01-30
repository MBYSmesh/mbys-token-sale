const MBYSCrowdsale = artifacts.require("MBYSCrowdsale");
const MBYSToken = artifacts.require("MBYSToken.sol");

module.exports = function(deployer, network, accounts) {
    if (network == "localdeploy") {
        // midnight on feb 6
        const startTime = 1517893200;
        // midnight on mar 1
        const endTime = 1519880400;
        const wallet = accounts[0];
        const controller = accounts[1];
        deployer.deploy(MBYSCrowdsale, startTime, endTime, wallet, controller);
    }
};
