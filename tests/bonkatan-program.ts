import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import { ByteifyEndianess, serializeUint64 } from "byteify";
import {
    createAssociatedTokenAccount,
    createMint,
    getAssociatedTokenAddressSync,
    mintTo,
} from "@solana/spl-token";
import { BonkatanProgram } from "../target/types/bonkatan_program";
import { assert, expect } from "chai";

describe("bonkatan-program", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace
        .BonkatanProgram as Program<BonkatanProgram>;

    let adminKey = anchor.web3.Keypair.fromSecretKey(
        Uint8Array.from([
            90, 179, 114, 243, 159, 85, 58, 27, 223, 53, 103, 71, 226, 118, 100,
            83, 83, 220, 154, 1, 24, 2, 42, 236, 99, 126, 93, 34, 186, 211, 213,
            233, 116, 200, 107, 145, 245, 30, 100, 235, 14, 189, 65, 65, 34,
            140, 145, 243, 155, 122, 254, 175, 134, 186, 74, 146, 164, 125, 89,
            250, 176, 94, 247, 63,
        ])
    );

    let bonkMintKey = anchor.web3.Keypair.fromSecretKey(
        Uint8Array.from([
            53, 60, 194, 34, 98, 5, 252, 166, 79, 34, 24, 18, 192, 140, 252,
            165, 225, 151, 104, 68, 24, 137, 36, 231, 84, 197, 128, 159, 249,
            190, 125, 140, 16, 42, 184, 79, 134, 142, 71, 62, 33, 13, 85, 70,
            62, 49, 250, 44, 183, 50, 238, 90, 10, 78, 213, 35, 92, 154, 159,
            114, 74, 6, 26, 243,
        ])
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
        });
        let ix2 = anchor.web3.SystemProgram.transfer({
            fromPubkey: program.provider.publicKey,
            toPubkey: player1.publicKey,
            lamports: 1000000000,
        });
        let ix3 = anchor.web3.SystemProgram.transfer({
            fromPubkey: program.provider.publicKey,
            toPubkey: player2.publicKey,
            lamports: 1000000000,
        });

        let recentBlockhash =
            await program.provider.connection.getLatestBlockhash();

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
            5,
            bonkMintKey
        );

        let player1Ata = await createAssociatedTokenAccount(
            program.provider.connection,
            player1,
            bonkMint,
            player1.publicKey
        );

        await mintTo(
            program.provider.connection,
            player1,
            bonkMint,
            player1Ata,
            adminKey,
            1_000_000
        );

        let player2Ata = await createAssociatedTokenAccount(
            program.provider.connection,
            player2,
            bonkMint,
            player2.publicKey
        );

        await mintTo(
            program.provider.connection,
            player2,
            bonkMint,
            player2Ata,
            adminKey,
            1_000_000
        );
    });

    it("Create a lobby", async () => {
        let config = {
            gameStartSlot: new anchor.BN(0),
            auctionTokensStart: new anchor.BN(1000),
            stepTokens: new anchor.BN(10),
            stepSlots: new anchor.BN(120),
            victoryMax: new anchor.BN(12),
        };
        let gameTiles = get_init_game_tiles();

        let gamePda = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("game1"), adminKey.publicKey.toBuffer()],
            program.programId
        );

        console.log("GAME 0 BUMP: ", gamePda[1]);
        const tx = await program.methods
            .createLobby(gameId, config, gameTiles)
            .accounts({
                game: gameKey.publicKey,
            })
            .signers([adminKey, gameKey])
            .rpc();

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

        let config = {
            gameStartSlot: new anchor.BN(0),
            auctionTokensStart: new anchor.BN(10000),
            stepTokens: new anchor.BN(10),
            stepSlots: new anchor.BN(120),
            victoryMax: new anchor.BN(12),
        };
        let gameTiles = get_init_game_tiles();
        const createLobbySig = await program.methods
            .createLobby(tempGameId, config, gameTiles)
            .accounts({
                game: tempGame.publicKey,
            })
            .signers([adminKey, tempGame])
            .rpc();

        const destroyLobbySig = await program.methods
            .destroyLobby()
            .accounts({
                game: tempGame.publicKey,
            })
            .signers([adminKey])
            .rpc();

        let game = await program.account.gamePda.fetchNullable(
            tempGame.publicKey
        );

        expect(game).to.be.null;

        let rollPda = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("rolls"), tempGame.publicKey.toBuffer()],
            program.programId
        );
        let rolls = await program.account.gamePda.fetchNullable(rollPda[0]);

        expect(rolls).to.be.null;
    });

    it("Player1 joins the lobby", async () => {
        const tx = await program.methods
            .joinLobby()
            .accounts({
                owner: player1.publicKey,
                game: gameKey.publicKey,
            })
            .signers([player1])
            .rpc();
        // Verify Player1's account is created
    });

    it("Player2 joins the lobby", async () => {
        const tx = await program.methods
            .joinLobby()
            .accounts({
                owner: player2.publicKey,
                game: gameKey.publicKey,
            })
            .signers([player2])
            .rpc();
        // Verify Player2's account is created
    });

    it("Player1 takes first turn and settles", async () => {
        let player1Ata = getAssociatedTokenAddressSync(
            bonkMint,
            player1.publicKey
        );
        const tx = await program.methods
            .takeTurn({ settle: {} })
            .accounts({
                owner: player1.publicKey,
                game: gameKey.publicKey,
                ownerAta: player1Ata,
            })
            .signers([player1])
            .rpc();
        // Verify settlement added
    });

    it("Player2 must claim before taking first turn", async () => {
        const tx = await program.methods
            .claimResources()
            .accounts({
                owner: player2.publicKey,
                game: gameKey.publicKey,
            })
            .signers([player2])
            .rpc();
        // Verify resources are still 0
    });

    it("Player2 takes first turn and settles", async () => {
        let player2Ata = getAssociatedTokenAddressSync(
            bonkMint,
            player2.publicKey
        );
        const tx = await program.methods
            .takeTurn({ settle: {} })
            .accounts({
                owner: player2.publicKey,
                game: gameKey.publicKey,
                ownerAta: player2Ata,
            })
            .signers([player2])
            .rpc();
        // Verify settlement added
    });

    it("Player2 must claim before taking next turn", async () => {
        const tx = await program.methods
            .claimResources()
            .accounts({
                owner: player2.publicKey,
                game: gameKey.publicKey,
            })
            .signers([player2])
            .rpc();
        // Verify resources have increased
    });

    it("Player2 takes another turn and settles", async () => {
        let player2Ata = getAssociatedTokenAddressSync(
            bonkMint,
            player2.publicKey
        );
        const tx = await program.methods
            .takeTurn({ settle: {} })
            .accounts({
                owner: player2.publicKey,
                game: gameKey.publicKey,
                ownerAta: player2Ata,
            })
            .signers([player2])
            .rpc({ skipPreflight: true });
        // Verify second settlement added
    });

    it("Player1 must claim before taking next turn", async () => {
        const tx = await program.methods
            .claimResources()
            .accounts({
                owner: player1.publicKey,
                game: gameKey.publicKey,
            })
            .signers([player1])
            .rpc();
        // Verify resources have increased
    });
});

function get_init_game_tiles(): any[] {
    return [
        {
            tileYield: { sparse: {} },
            tileResource: { wheat: {} },
        },
        {
            tileYield: { normal: {} },
            tileResource: { wheat: {} },
        },
        {
            tileYield: { sparse: {} },
            tileResource: { wheat: {} },
        },
        {
            tileYield: { sparse: {} },
            tileResource: { brick: {} },
        },
        {
            tileYield: { normal: {} },
            tileResource: { brick: {} },
        },
        {
            tileYield: { rich: {} },
            tileResource: { brick: {} },
        },
        {
            tileYield: { sparse: {} },
            tileResource: { wood: {} },
        },
        {
            tileYield: { normal: {} },
            tileResource: { wood: {} },
        },
        {
            tileYield: { rich: {} },
            tileResource: { wood: {} },
        },
        {
            tileYield: { sparse: {} },
            tileResource: { sheep: {} },
        },
        {
            tileYield: { normal: {} },
            tileResource: { sheep: {} },
        },
        {
            tileYield: { rich: {} },
            tileResource: { sheep: {} },
        },
        {
            tileYield: { sparse: {} },
            tileResource: { ore: {} },
        },
        {
            tileYield: { normal: {} },
            tileResource: { ore: {} },
        },
        {
            tileYield: { rich: {} },
            tileResource: { ore: {} },
        },
        {
            tileYield: { sparse: {} },
            tileResource: { wheat: {} },
        },
        {
            tileYield: { sparse: {} },
            tileResource: { brick: {} },
        },
        {
            tileYield: { sparse: {} },
            tileResource: { wood: {} },
        },
        {
            tileYield: { normal: {} },
            tileResource: { sheep: {} },
        },
        {
            tileYield: { sparse: {} },
            tileResource: { ore: {} },
        },
    ];
}
