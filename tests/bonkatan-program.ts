import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import {createAssociatedTokenAccount, createMint, getAssociatedTokenAddressSync, mintTo} from "@solana/spl-token";
import { BonkatanProgram } from "../target/types/bonkatan_program";
import { assert, expect } from "chai";

describe("bonkatan-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.BonkatanProgram as Program<BonkatanProgram>;

  let bonkMintKey = anchor.web3.Keypair.generate();
  let bonkMint = bonkMintKey.publicKey;
  let bonkMintAuth = anchor.web3.Keypair.generate();

  let gameKey = anchor.web3.Keypair.generate();

  let gameId = new anchor.BN(0);

  let player1 = anchor.web3.Keypair.generate();
  let player2 = anchor.web3.Keypair.generate();

  before(async () => {
    let payer = anchor.web3.Keypair.generate();
    let ix1 = anchor.web3.SystemProgram.transfer({
      fromPubkey: program.provider.publicKey,
      toPubkey: payer.publicKey,
      lamports: 10000000000,
    })
    let ix2 = anchor.web3.SystemProgram.transfer({
      fromPubkey: program.provider.publicKey,
      toPubkey: player1.publicKey,
      lamports: 1000000000,
    })
    let ix3 = anchor.web3.SystemProgram.transfer({
      fromPubkey: program.provider.publicKey,
      toPubkey: player2.publicKey,
      lamports: 1000000000,
    })

    let recentBlockhash = await program.provider.connection.getLatestBlockhash();

    let messageV0 = new anchor.web3.TransactionMessage({
      payerKey: program.provider.publicKey,
      recentBlockhash: recentBlockhash.blockhash,
      instructions: [ix1, ix2, ix3],

    }).compileToV0Message();

    let transferTx = new anchor.web3.VersionedTransaction(messageV0);

    await program.provider.sendAndConfirm(transferTx);

    await createMint(
      program.provider.connection,
      payer,
      bonkMintAuth.publicKey,
      null,
      9,
      bonkMintKey,
    );

    let player1Ata = await createAssociatedTokenAccount(
      program.provider.connection,
      player1,
      bonkMint,
      player1.publicKey,
    );

    await mintTo(
      program.provider.connection,
      player1,
      bonkMint,
      player1Ata,
      bonkMintAuth,
      10000,
    );

    let player2Ata = await createAssociatedTokenAccount(
      program.provider.connection,
      player2,
      bonkMint,
      player2.publicKey,
    );

    await mintTo(
      program.provider.connection,
      player2,
      bonkMint,
      player2Ata,
      bonkMintAuth,
      10000,
    );
  });

  it("Create a lobby", async () => {
    let config  = {
      gameStartSlot: new anchor.BN(0),
      auctionTokensStart: new anchor.BN(10000),
      stepTokens: new anchor.BN(10),
      stepSlots: new anchor.BN(120),
      victoryMax: new anchor.BN(12),
    };
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

  it("Destroy a lobby", async () => {

    let tempGame = anchor.web3.Keypair.generate();
    let tempGameId = new anchor.BN(2);

    let config  = {
      gameStartSlot: new anchor.BN(0),
      auctionTokensStart: new anchor.BN(10000),
      stepTokens: new anchor.BN(10),
      stepSlots: new anchor.BN(120),
      victoryMax: new anchor.BN(12),
    };
    let gameTiles = get_init_game_tiles();
    const createLobbySig = await program.methods.createLobby(
      tempGameId,
      config,
      gameTiles,
    ).accounts({
      admin: program.provider.publicKey,
      game: tempGame.publicKey,
      bonkMint,
    }).signers([tempGame]).rpc();

    const destroyLobbySig = await program.methods.destroyLobby().accounts({
      game: tempGame.publicKey,
    }).rpc();

    let game = await program.account.gamePda.fetchNullable(tempGame.publicKey);
    console.log("GAME : ", game);

    expect(game).to.be.null;
  });

  // it("Join a lobby", async () => {
  //   const tx = await program.methods.joinLobby().rpc();
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


