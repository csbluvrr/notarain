const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TestamentRegistry", function () {
  let admin;
  let testator;
  let notary;
  let other;
  let contract;

  beforeEach(async function () {
    [admin, testator, notary, other] = await ethers.getSigners();

    const ContractFactory = await ethers.getContractFactory("TestamentRegistry");
    contract = await ContractFactory.deploy();
    await contract.waitForDeployment();
  });

  it("Contract deployment sets admin correctly", async function () {
    const adminAddr = await admin.getAddress();
    expect(await contract.admin()).to.equal(adminAddr);
  });

  it("authorizeNotary works and emits event", async function () {
    const notaryAddr = await notary.getAddress();
    await expect(contract.connect(admin).authorizeNotary(notaryAddr))
      .to.emit(contract, "NotaryAuthorized")
      .withArgs(notaryAddr);

    expect(await contract.authorizedNotaries(notaryAddr)).to.equal(true);
  });

  it("Non-admin cannot call authorizeNotary", async function () {
    const notaryAddr = await notary.getAddress();
    await expect(contract.connect(testator).authorizeNotary(notaryAddr)).to.be.revertedWith("Not admin");
  });

  it("registerTestament creates a testament with Pending status and emits event", async function () {
    const ipfsCid = "bafybeigdyrzt-example-cid";
    const documentHash = ethers.keccak256(ethers.toUtf8Bytes("test-document"));

    const testatorAddr = await testator.getAddress();

    await expect(contract.connect(testator).registerTestament(ipfsCid, documentHash))
      .to.emit(contract, "TestamentRegistered")
      .withArgs(1n, testatorAddr, ipfsCid);

    const t = await contract.testaments(1n);
    expect(t.id).to.equal(1n);
    expect(t.testator).to.equal(testatorAddr);
    expect(t.ipfsCid).to.equal(ipfsCid);
    expect(t.documentHash).to.equal(documentHash);
    expect(t.status).to.equal(0n); // Pending
    expect(t.notary).to.equal(ethers.ZeroAddress);
  });

  it("approveTestament changes status to Approved, only callable by notary", async function () {
    const ipfsCid = "bafybeigdyrzt-approve-cid";
    const documentHash = ethers.keccak256(ethers.toUtf8Bytes("approve-document"));

    const testatorAddr = await testator.getAddress();
    const notaryAddr = await notary.getAddress();

    await contract.connect(testator).registerTestament(ipfsCid, documentHash);
    await contract.connect(admin).authorizeNotary(notaryAddr);

    await expect(contract.connect(notary).approveTestament(1n))
      .to.emit(contract, "TestamentApproved")
      .withArgs(1n, notaryAddr);

    const t = await contract.testaments(1n);
    expect(t.status).to.equal(1n); // Approved
    expect(t.notary).to.equal(notaryAddr);
    expect(t.testator).to.equal(testatorAddr);
  });

  it("rejectTestament changes status to Rejected, only callable by notary", async function () {
    const ipfsCid = "bafybeigdyrzt-reject-cid";
    const documentHash = ethers.keccak256(ethers.toUtf8Bytes("reject-document"));

    const testatorAddr = await testator.getAddress();
    const notaryAddr = await notary.getAddress();

    await contract.connect(testator).registerTestament(ipfsCid, documentHash);
    await contract.connect(admin).authorizeNotary(notaryAddr);

    await expect(contract.connect(notary).rejectTestament(1n))
      .to.emit(contract, "TestamentRejected")
      .withArgs(1n, notaryAddr);

    const t = await contract.testaments(1n);
    expect(t.status).to.equal(2n); // Rejected
    expect(t.notary).to.equal(notaryAddr);
    expect(t.testator).to.equal(testatorAddr);
  });

  it("confirmDeath changes status to Executed, only works on Approved testaments", async function () {
    const ipfsCid = "bafybeigdyrzt-execute-cid";
    const documentHash = ethers.keccak256(ethers.toUtf8Bytes("execute-document"));

    const notaryAddr = await notary.getAddress();

    await contract.connect(testator).registerTestament(ipfsCid, documentHash);
    await contract.connect(admin).authorizeNotary(notaryAddr);

    // Not approved yet => should fail.
    await expect(contract.connect(notary).confirmDeath(1n)).to.be.revertedWith("Not approved");

    await contract.connect(notary).approveTestament(1n);

    await expect(contract.connect(notary).confirmDeath(1n))
      .to.emit(contract, "TestamentExecuted")
      .withArgs(1n);

    const t = await contract.testaments(1n);
    expect(t.status).to.equal(3n); // Executed
  });

  it("Unauthorized wallet cannot call notary functions", async function () {
    const ipfsCid = "bafybeigdyrzt-unauth-cid";
    const documentHash = ethers.keccak256(ethers.toUtf8Bytes("unauthorized-document"));

    const testatorAddr = await testator.getAddress();
    await contract.connect(testator).registerTestament(ipfsCid, documentHash);

    // authorize a different notary to ensure only this signer is allowed.
    const notaryAddr = await notary.getAddress();
    await contract.connect(admin).authorizeNotary(notaryAddr);

    // other signer should be rejected for all notary actions.
    await expect(contract.connect(other).approveTestament(1n)).to.be.revertedWith("Not a notary");
    await expect(contract.connect(other).rejectTestament(1n)).to.be.revertedWith("Not a notary");
    await expect(contract.connect(other).confirmDeath(1n)).to.be.revertedWith("Not a notary");

    const t = await contract.testaments(1n);
    expect(t.testator).to.equal(testatorAddr);
  });
});

