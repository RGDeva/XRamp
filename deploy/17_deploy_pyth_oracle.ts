import "module-alias/register";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import {
  PYTH_CONTRACT,
} from "../deployments/parameters";
import {
  getDeployedContractAddress,
  waitForDeploymentDelay,
} from "../deployments/helpers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deploy } = await hre.deployments;
  const network = hre.deployments.getNetworkName();

  const [deployer] = await hre.getUnnamedAccounts();

  // Resolve Pyth contract address
  let pythAddress = PYTH_CONTRACT[network] || "";
  if (!pythAddress) {
    if (network === "localhost" || network === "hardhat") {
      const pythMock = await deploy("PythMock", {
        from: deployer,
        args: [],
      });
      pythAddress = pythMock.address;
      console.log("PythMock deployed at", pythAddress);
      await waitForDeploymentDelay(hre);
    } else {
      throw new Error(`Missing Pyth contract address for network ${network}`);
    }
  }

  // Deploy PythOracleAdapter (NOT Ownable, stateless except immutable pyth address)
  const pythOracleAdapter = await deploy("PythOracleAdapter", {
    from: deployer,
    args: [pythAddress],
  });
  console.log("PythOracleAdapter deployed at", pythOracleAdapter.address);
  await waitForDeploymentDelay(hre);

  console.log("Pyth oracle deploy finished...");
};

func.skip = async (hre: HardhatRuntimeEnvironment): Promise<boolean> => {
  const network = hre.network.name;
  if (network !== "localhost") {
    // Skip if already deployed
    try {
      getDeployedContractAddress(hre.network.name, "PythOracleAdapter");
      return true;
    } catch (e) {}
    // Skip if V2 periphery isn't deployed yet
    try {
      getDeployedContractAddress(hre.network.name, "ProtocolViewerV2");
    } catch (e) {
      console.log(`Skipping PythOracleAdapter deploy: ProtocolViewerV2 not found on ${network}`);
      return true;
    }
    return false;
  }
  return false;
};

func.dependencies = ["15_deploy_v2_periphery"];

export default func;
