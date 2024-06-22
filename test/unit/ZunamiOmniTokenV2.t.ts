import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {ZunamiOmniToken} from "../../typechain-types";

describe('ZunamiOmniTokenV2', () => {
    let admin: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let carrol: SignerWithAddress;
    let mallroy: SignerWithAddress;

    let token: ZunamiOmniToken;

    beforeEach(async () => {
        [admin, alice, bob, carrol, mallroy] = await ethers.getSigners();

        const TokenFactory = await ethers.getContractFactory('ZunamiOmniTokenV2', admin);
        token = (await TokenFactory.deploy("Test Token", "TST")) as ZunamiOmniToken;
    });

    it('should have correct name and symbol and default admin', async () => {
        expect(await token.name()).to.be.eq('Test Token');
        expect(await token.symbol()).to.be.eq('TST');
        expect(await token.hasRole(await token.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
    });

    it('should have mint and burn', async () => {

      await expect(
        token.connect(admin).mint(admin.address, 1000)
      ).to.be.revertedWithCustomError(
        token,
        `AccessControlUnauthorizedAccount`
      );

      await expect(
        token.connect(alice).mint(admin.address, 1000)
      ).to.be.revertedWithCustomError(
        token,
        `AccessControlUnauthorizedAccount`
      );

      await token.connect(admin).grantRole(await token.MINTER_ROLE(), alice.address);

      await token.connect(alice).mint(bob.address, 1000);

      expect(await token.balanceOf(bob.address)).to.be.eq(1000);

      await token.connect(bob).transfer(admin.address, 100);

      await token.connect(bob).transfer(alice.address, 100);

      await expect(
        token.connect(admin).burn(100)
      ).to.be.revertedWithCustomError(
        token,
        `AccessControlUnauthorizedAccount`
      );

      await expect(
        token.connect(alice).burn(100)
      ).to.be.revertedWithCustomError(
        token,
        `AccessControlUnauthorizedAccount`
      );

      await token.connect(admin).grantRole(await token.BURNER_ROLE(), alice.address);

      expect(await token.balanceOf(alice.address)).to.be.eq(100);

      await token.connect(alice).burn(100);

      expect(await token.balanceOf(alice.address)).to.be.eq(0);

      await token.connect(admin).grantRole(await token.BURNER_ROLE(), admin.address);

      expect(await token.balanceOf(admin.address)).to.be.eq(100);

      await token.connect(admin).burn(100);

      expect(await token.balanceOf(admin.address)).to.be.eq(0);

      await token.connect(admin).grantRole(await token.BURNER_ROLE(), bob.address);

      await token.connect(bob).burn(800);

      expect(await token.balanceOf(bob.address)).to.be.eq(0);
    });

});
