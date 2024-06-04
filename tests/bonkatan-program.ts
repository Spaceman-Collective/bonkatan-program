import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import {createMint} from "@solana/spl-token";
import { BonkatanProgram } from "../target/types/bonkatan_program";
import { assert } from "chai";

describe("bonkatan-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.BonkatanProgram as Program<BonkatanProgram>;

  it("Creat a lobby", async () => {
    let payer = anchor.web3.Keypair.generate();

    let ix = anchor.web3.SystemProgram.transfer({
      fromPubkey: program.provider.publicKey,
      toPubkey: payer.publicKey,
      lamports: 100000000000,
    })

    let recentBlockhash = await program.provider.connection.getLatestBlockhash();

    let messageV0 = new anchor.web3.TransactionMessage({
      payerKey: program.provider.publicKey,
      recentBlockhash: recentBlockhash.blockhash,
      instructions: [ix],

    }).compileToV0Message();

    let transferTx = new anchor.web3.VersionedTransaction(messageV0);

    await program.provider.sendAndConfirm(transferTx);

    let bonkMintAuth = anchor.web3.Keypair.generate();

    let bonkMint = await createMint(
      program.provider.connection,
      payer,
      bonkMintAuth.publicKey,
      null,
      9,
    );


    let config  = {
      gameStartSlot: new anchor.BN(0),
      auctionTokensStart: new anchor.BN(10000),
      stepTokens: new anchor.BN(10),
      stepSlots: new anchor.BN(120),
      victoryMax: new anchor.BN(12),
    };


    let gameKey = anchor.web3.Keypair.generate();

    let gameId = new anchor.BN(0);
    let gameTiles = get_init_game_tiles();

    const tx = await program.methods.createLobby(
      gameId,
      config,
      gameTiles,
    ).accounts({
      admin: program.provider.publicKey,
      game: gameKey.publicKey,
      bonkMint,
    }).signers([gameKey]).rpc();

    console.log("Your transaction signature", tx);

    // let gameAccount = await program.provider.connection.getAccountInfo(gameKey.publicKey);
    // console.log("GAME ACCOUNTINFO : ", gameAccount);
    let game = await program.account.gamePda.fetch(gameKey.publicKey);
    console.log("GAME : ", game);

    // Verify Game data
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

function get_init_game_tiles(): any[] {
      return [
        {
          tileId: 0,
          tileYield: { sparse: {}},
          tileResource: { wheat: {}},
        },
        {
          tileId: 1,
          tileYield: { normal: {}},
          tileResource: { wheat: {}},
        },
        {
          tileId: 2,
          tileYield: { sparse: {}},
          tileResource: { wheat: {}},
        },
        {
          tileId: 3,
          tileYield: { sparse: {}},
          tileResource: { brick: {}},
        },
        {
          tileId: 4,
          tileYield: { normal: {}},
          tileResource: { brick: {}},
        },
        {
          tileId: 5,
          tileYield: { rich: {}},
          tileResource: { brick: {}},
        },
        {
          tileId: 6,
          tileYield: { sparse: {}},
          tileResource: { wood: {}},
        },
        {
          tileId: 7,
          tileYield: { normal: {}},
          tileResource: { wood: {}},
        },
        {
          tileId: 8,
          tileYield: { rich: {}},
          tileResource: { wood: {}},
        },
        {
          tileId: 9,
          tileYield: { sparse: {}},
          tileResource: { sheep: {}},
        },
        {
          tileId: 10,
          tileYield: { normal: {}},
          tileResource: { sheep: {}},
        },
        {
          tileId: 11,
          tileYield: { rich: {}},
          tileResource: { sheep: {}},
        },
        {
          tileId: 12,
          tileYield: { sparse: {}},
          tileResource: { ore: {}},
        },
        {
          tileId: 13,
          tileYield: { normal: {}},
          tileResource: { ore: {}},
        },
        {
          tileId: 14,
          tileYield: { rich: {}},
          tileResource: { ore: {}},
        },
        {
          tileId: 15,
          tileYield: { sparse: {}},
          tileResource: { wheat: {}},
        },
        {
          tileId: 16,
          tileYield: { sparse: {}},
          tileResource: { brick: {}},
        },
        {
          tileId: 17,
          tileYield: { sparse: {}},
          tileResource: { wood: {}},
        },
        {
          tileId: 18,
          tileYield: { normal: {}},
          tileResource: { sheep: {}},
        },
        {
          tileId: 19,
          tileYield: { sparse: {}},
          tileResource: { ore: {}},
        },
      ]
}


