import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import {createAssociatedTokenAccount, createMint, getAssociatedTokenAddressSync, mintTo} from "@solana/spl-token";
import { BonkatanProgram } from "../target/types/bonkatan_program";
import { assert, expect } from "chai";

describe("bonkatan-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.BonkatanProgram as Program<BonkatanProgram>;

  let adminKey = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from([39,223,117,182,66,161,252,179,104,68,74,62,174,136,163,222,29,159,17,109,248,178,87,96,10,20,42,38,54,112,99,6,127,141,58,215,203,132,231,220,88,89,44,138,119,12,190,13,66,245,251,203,67,80,143,165,2,17,31,165,249,187,254,191])
  );

  let bonkMintKey = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from([103,168,102,204,19,115,99,145,26,4,15,61,240,221,170,235,92,216,215,234,181,101,86,253,169,102,187,118,108,16,79,228,19,125,39,218,162,209,85,16,248,34,17,124,191,1,74,130,94,173,236,130,219,125,85,76,80,131,165,197,205,93,156,202])
  );
  let bonkMint = bonkMintKey.publicKey;

  let gameKey = anchor.web3.Keypair.generate();

  let gameId = new anchor.BN(0);

  let player1 = anchor.web3.Keypair.generate();
  let player2 = anchor.web3.Keypair.generate();

  before(async () => {
    let ix1 = anchor.web3.SystemProgram.transfer({
      fromPubkey: program.provider.publicKey,
      toPubkey: adminKey.publicKey,
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
      adminKey,
      adminKey.publicKey,
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
      adminKey,
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
      adminKey,
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
      game: gameKey.publicKey,
    }).signers([adminKey, gameKey]).rpc();

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
      game: tempGame.publicKey,
    }).signers([adminKey, tempGame]).rpc();

    const destroyLobbySig = await program.methods.destroyLobby().accounts({
      game: tempGame.publicKey,
    }).signers([adminKey]).rpc();

    let game = await program.account.gamePda.fetchNullable(tempGame.publicKey);
    console.log("GAME : ", game);
    expect(game).to.be.null;
    // TODO: verify rolls account is closed.
  });

  it("Join a lobby", async () => {
    const tx = await program.methods.joinLobby().accounts({
      owner: player1.publicKey,
      game: gameKey.publicKey,
    }).signers([player1]).rpc();
    console.log("Your transaction signature", tx);

    // Verify Player1's account is created
  });

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


