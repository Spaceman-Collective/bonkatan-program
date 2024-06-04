import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BonkatanProgram } from "../target/types/bonkatan_program";

describe("bonkatan-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.BonkatanProgram as Program<BonkatanProgram>;

  it("Creat a lobby", async () => {
    const tx = await program.methods.createLobby().rpc();


    // Verify GamePDA data
    let game_pda = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("GamePDA")],
      program.programId
    );
    // const game = await program.account.gamePda.fetch()


    console.log("Your transaction signature", tx);
  });
  // it("Destroy a lobby", async () => {
  //   const tx = await program.methods.destroyLobby().rpc();
  //   console.log("Your transaction signature", tx);
  // });
  // it("Join a lobby", async () => {
  //   const tx = await program.methods.joinLobby().rpc();
  //   console.log("Your transaction signature", tx);
  // });
  // it("Start a lobby", async () => {
  //   const tx = await program.methods.startLobby().rpc();
  //   console.log("Your transaction signature", tx);
  // });
});
