const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProofOfQuestRegistry", function () {
  const projectRefHash = ethers.keccak256(ethers.toUtf8Bytes("anonymous-project:salt"));
  const evidenceHash = ethers.sha256(ethers.toUtf8Bytes("approved-design-file"));

  async function deployFixture() {
    const [issuer, designer, stranger] = await ethers.getSigners();
    const registry = await ethers.deployContract("ProofOfQuestRegistry");
    await registry.waitForDeployment();
    return { registry, issuer, designer, stranger };
  }

  async function issueFixture() {
    const context = await deployFixture();
    const { registry, designer } = context;
    await registry.issueCredential(
      designer.address,
      projectRefHash,
      evidenceHash,
      "电商详情页",
      "执行设计师",
      "完成匿名商品详情页的视觉排版与修改"
    );
    return context;
  }

  it("issues a credential and indexes it by designer", async function () {
    const { registry, issuer, designer } = await deployFixture();

    await expect(
      registry.issueCredential(
        designer.address,
        projectRefHash,
        evidenceHash,
        "电商详情页",
        "执行设计师",
        "完成匿名商品详情页的视觉排版与修改"
      )
    )
      .to.emit(registry, "CredentialIssued")
      .withArgs(1, issuer.address, designer.address, projectRefHash, evidenceHash);

    const credential = await registry.getCredential(1);
    expect(credential.issuer).to.equal(issuer.address);
    expect(credential.designer).to.equal(designer.address);
    expect(credential.projectRefHash).to.equal(projectRefHash);
    expect(credential.evidenceHash).to.equal(evidenceHash);
    expect(credential.projectCategory).to.equal("电商详情页");
    expect(credential.role).to.equal("执行设计师");
    expect(credential.publicSummary).to.equal("完成匿名商品详情页的视觉排版与修改");
    expect(credential.issuedAt).to.be.greaterThan(0);
    expect(credential.revokedAt).to.equal(0);
    expect(await registry.getDesignerCredentials(designer.address)).to.deep.equal([1n]);
    expect(await registry.isCredentialValid(1)).to.equal(true);
  });

  it("allows only the issuer to revoke and preserves history", async function () {
    const { registry, issuer } = await issueFixture();

    await expect(registry.revokeCredential(1))
      .to.emit(registry, "CredentialRevoked")
      .withArgs(1, issuer.address, anyValue);

    const credential = await registry.getCredential(1);
    expect(credential.revokedAt).to.be.greaterThan(0);
    expect(credential.projectRefHash).to.equal(projectRefHash);
    expect(await registry.isCredentialValid(1)).to.equal(false);
  });

  it("rejects revocation by another wallet", async function () {
    const { registry, issuer, stranger } = await issueFixture();

    await expect(registry.connect(stranger).revokeCredential(1))
      .to.be.revertedWithCustomError(registry, "NotCredentialIssuer")
      .withArgs(stranger.address, issuer.address);
  });

  it("rejects invalid issuance and unknown credentials", async function () {
    const { registry } = await deployFixture();

    await expect(
      registry.issueCredential(
        ethers.ZeroAddress,
        projectRefHash,
        evidenceHash,
        "UI",
        "执行设计师",
        "摘要"
      )
    ).to.be.revertedWithCustomError(registry, "InvalidDesigner");

    await expect(registry.getCredential(99))
      .to.be.revertedWithCustomError(registry, "CredentialNotFound")
      .withArgs(99);
  });

  it("cannot revoke the same credential twice", async function () {
    const { registry } = await issueFixture();
    await registry.revokeCredential(1);

    await expect(registry.revokeCredential(1))
      .to.be.revertedWithCustomError(registry, "CredentialAlreadyRevoked")
      .withArgs(1);
  });
});

const anyValue = require("@nomicfoundation/hardhat-chai-matchers/withArgs").anyValue;
