import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX");

  // 1. Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDC.deploy();
  await mockUsdc.waitForDeployment();
  const mockUsdcAddress = await mockUsdc.getAddress();
  console.log("MockUSDC deployed to:", mockUsdcAddress);

  // 2. Deploy XRampEscrow with deployer as arbiter
  const XRampEscrow = await ethers.getContractFactory("XRampEscrow");
  const escrow = await XRampEscrow.deploy(deployer.address);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("XRampEscrow deployed to:", escrowAddress);

  // 3. Mint 1,000,000 mUSDC to deployer for testing
  const mintAmount = ethers.parseUnits("1000000", 6);
  const mintTx = await mockUsdc.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log("Minted 1,000,000 mUSDC to deployer");

  // 4. Write config JSON
  const config = {
    chainId: 43113,
    chainName: "Avalanche Fuji Testnet",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    explorerUrl: "https://testnet.snowtrace.io",
    mockUsdcAddress: mockUsdcAddress,
    escrowAddress: escrowAddress,
    arbiterAddress: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  // Write to contracts/deployed.json
  const outPath = path.join(__dirname, "..", "deployed.json");
  fs.writeFileSync(outPath, JSON.stringify(config, null, 2));
  console.log("\nConfig written to:", outPath);

  // Also write to src/lib for frontend import
  const frontendConfigPath = path.join(__dirname, "..", "..", "src", "lib", "fujiConfig.json");
  fs.writeFileSync(frontendConfigPath, JSON.stringify(config, null, 2));
  console.log("Config written to:", frontendConfigPath);

  console.log("\n✅ Deployment complete!");
  console.log(JSON.stringify(config, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
