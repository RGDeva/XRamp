import "module-alias/register";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

import {
  ACROSS_SPOKE_POOL,
  MULTI_SIG,
  USDC,
} from "../deployments/parameters";
import {
  addPostIntentHook,
  getDeployedContractAddress,
  setNewOwner,
  waitForDeploymentDelay,
} from "../deployments/helpers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy } = await hre.deployments;
  const network = hre.deployments.getNetworkName();

  const [deployer] = await hre.getUnnamedAccounts();
  const multiSig = MULTI_SIG[network] ? MULTI_SIG[network] : deployer;

  const orchestratorAddress = getDeployedContractAddress(network, "Orchestrator");
  const postIntentHookRegistryAddress = getDeployedContractAddress(network, "PostIntentHookRegistry");

  const usdcAddress = USDC[network]
    ? USDC[network]
    : getDeployedContractAddress(network, "USDCMock");

  let spokePoolAddress = ACROSS_SPOKE_POOL[network] || "";
  if (!spokePoolAddress) {
    if (network === "localhost" || network === "hardhat") {
      const spokePoolMock = await deploy("AcrossSpokePoolMock", {
        from: deployer,
        args: [],
      });
      spokePoolAddress = spokePoolMock.address;
      console.log("AcrossSpokePoolMock deployed at", spokePoolAddress);
      await waitForDeploymentDelay(hre);
    } else {
      throw new Error(`Missing Across SpokePool address for network ${network}`);
    }
  }

  const acrossBridgeHook = await deploy("AcrossBridgeHook", {
    from: deployer,
    args: [usdcAddress, orchestratorAddress, spokePoolAddress],
  });
  console.log("AcrossBridgeHook deployed at", acrossBridgeHook.address);
  await waitForDeploymentDelay(hre);

  const postIntentHookRegistry = await ethers.getContractAt("PostIntentHookRegistry", postIntentHookRegistryAddress);
  await addPostIntentHook(hre, postIntentHookRegistry, acrossBridgeHook.address);
  console.log("AcrossBridgeHook added to post intent hook registry");

  const acrossBridgeHookContract = await ethers.getContractAt("AcrossBridgeHook", acrossBridgeHook.address);
  await setNewOwner(hre, acrossBridgeHookContract, multiSig);
  console.log("AcrossBridgeHook ownership transferred to", multiSig);

  await waitForDeploymentDelay(hre);
};

func.skip = async (hre: HardhatRuntimeEnvironment): Promise<boolean> => {
  const network = hre.network.name;
  if (network !== "localhost") {
    // Skip if AcrossBridgeHook is already deployed
    try {
      getDeployedContractAddress(hre.network.name, "AcrossBridgeHook");
      return true;
    } catch (e) {
      // Not yet deployed — only proceed if Orchestrator exists
    }
    // Skip if Orchestrator hasn't been deployed yet on this network
    try {
      getDeployedContractAddress(hre.network.name, "Orchestrator");
    } catch (e) {
      console.log(`Skipping AcrossBridgeHook deploy: Orchestrator not found on ${network}`);
      return true;
    }
    // Skip if no Across SpokePool is configured for this network
    if (!ACROSS_SPOKE_POOL[network]) {
      console.log(`Skipping AcrossBridgeHook deploy: No Across SpokePool configured for ${network}`);
      return true;
    }
    return false;
  }
  return false;
};

func.dependencies = ["00_deploy_system"];

export default func;
