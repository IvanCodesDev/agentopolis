const hre = require("hardhat");

async function main() {
  const registry = await hre.ethers.deployContract("ProofOfQuestRegistry");
  await registry.waitForDeployment();

  console.log("ProofOfQuestRegistry deployed to:", await registry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
