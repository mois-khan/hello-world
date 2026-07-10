import { expect } from "chai";
import hre from "hardhat";

describe("LandRegistry: registerParcel", function () {
  let landRegistry;
  let admin, registrar, citizen, unauthorized;

  beforeEach(async function () {
    [admin, registrar, citizen, unauthorized] = await hre.ethers.getSigners();
    const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();
    await landRegistry.waitForDeployment();
    
    // Grant REGISTRAR_ROLE to the 'registrar' account
    const REGISTRAR_ROLE = await landRegistry.REGISTRAR_ROLE();
    await landRegistry.grantRole(REGISTRAR_ROLE, registrar.address);
  });

  it("should register a parcel correctly and set the owner", async function () {
    const docHash = hre.ethers.id("mock-document");
    
    const tx = await landRegistry.connect(registrar).registerParcel(
      citizen.address,
      "SURV-123",
      "Mumbai",
      "19.0760,72.8777",
      1500,
      docHash
    );

    const receipt = await tx.wait();
    
    await expect(tx)
      .to.emit(landRegistry, "ParcelRegistered")
      .withArgs(1n, citizen.address, "SURV-123", docHash);

    // Verify ERC-721 owner
    expect(await landRegistry.ownerOf(1n)).to.equal(citizen.address);
    
    // Verify parcel struct fields
    const parcel = await landRegistry.parcels(1n);
    expect(parcel.surveyNumber).to.equal("SURV-123");
    expect(parcel.district).to.equal("Mumbai");
    expect(parcel.area).to.equal(1500n);
    expect(parcel.documentHash).to.equal(docHash);
  });

  it("should revert if a non-registrar tries to register a parcel", async function () {
    const docHash = hre.ethers.id("mock-document");
    const REGISTRAR_ROLE = await landRegistry.REGISTRAR_ROLE();
    
    // OpenZeppelin v4 AccessControl reverts with string format
    await expect(
      landRegistry.connect(unauthorized).registerParcel(
        citizen.address, "SURV-999", "Delhi", "28.7,77.1", 1000, docHash
      )
    ).to.be.revertedWith(
      `AccessControl: account ${unauthorized.address.toLowerCase()} is missing role ${REGISTRAR_ROLE}`
    );
  });
});
