import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { program } from 'commander';
import { readFileSync } from 'fs';
import { Keypair, Connection, LAMPORTS_PER_SOL, TransactionMessage, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import * as lib from './lib';
import { BN } from '@coral-xyz/anchor';

const conn = new Connection("http://localhost:8899", { commitment: "confirmed" });
const keys = {
    admin: Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync("./keys/admin.json").toString()) as number[])),
    p1: Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync("./keys/p1.json").toString()) as number[])),
    p2: Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync("./keys/p2.json").toString()) as number[])),
    p3: Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync("./keys/p3.json").toString()) as number[])),
    p4: Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync("./keys/p4.json").toString()) as number[]))
}


program
    .name("Bonkatan-CLI")

program
    .command('debug')
    .description("Debug command that does whatever we're testing rn")
    .action(async () => {
        console.log("Hello World!");
        console.log(await lib.getGameAccount(new BN(1)));
    })

// Setup
program
    .command('setup')
    .description("Assumes there's a keys/ folder and funds everyone with localbonk and sol")
    .action(async () => {
        // Fund the Admin Keypair
        await Promise.all([
            conn.requestAirdrop(keys.admin.publicKey, 10 * LAMPORTS_PER_SOL),
            conn.requestAirdrop(keys.p1.publicKey, 10 * LAMPORTS_PER_SOL),
            conn.requestAirdrop(keys.p2.publicKey, 10 * LAMPORTS_PER_SOL),
            conn.requestAirdrop(keys.p3.publicKey, 10 * LAMPORTS_PER_SOL),
            conn.requestAirdrop(keys.p4.publicKey, 10 * LAMPORTS_PER_SOL),
        ]).then(async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            console.log(`
                Admin funded with ${await conn.getBalance(keys.admin.publicKey) / LAMPORTS_PER_SOL} sol
                P1 funded with ${await conn.getBalance(keys.p1.publicKey) / LAMPORTS_PER_SOL} sol
                P2 funded with ${await conn.getBalance(keys.p2.publicKey) / LAMPORTS_PER_SOL} sol
                P3 funded with ${await conn.getBalance(keys.p3.publicKey) / LAMPORTS_PER_SOL} sol
                P4 funded with ${await conn.getBalance(keys.p4.publicKey) / LAMPORTS_PER_SOL} sol

            `)
        })

        // Create the Bonk Mint
        const bonkKey = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync("./keys/bonk_mint.json").toString()) as number[]));
        console.log(`Loaded bonk keypair: ${bonkKey.publicKey.toString()}`);
        const bonkMint = await createMint(conn, keys.admin, keys.admin.publicKey, keys.admin.publicKey, 5, bonkKey);
        console.log("SPL Token Minted at: ", bonkMint.toString());

        // Fund Players with LocalBonk
        const p1ATA = await getOrCreateAssociatedTokenAccount(conn, keys.p1, bonkMint, keys.p1.publicKey);
        const p2ATA = await getOrCreateAssociatedTokenAccount(conn, keys.p2, bonkMint, keys.p2.publicKey);
        const p3ATA = await getOrCreateAssociatedTokenAccount(conn, keys.p3, bonkMint, keys.p3.publicKey);
        const p4ATA = await getOrCreateAssociatedTokenAccount(conn, keys.p4, bonkMint, keys.p4.publicKey);

        // Mint 1B tokens to each Player
        await Promise.all([
            mintTo(conn, keys.p1, bonkMint, p1ATA.address, keys.admin, 1000000000_00000),
            mintTo(conn, keys.p2, bonkMint, p2ATA.address, keys.admin, 1000000000_00000),
            mintTo(conn, keys.p3, bonkMint, p3ATA.address, keys.admin, 1000000000_00000),
            mintTo(conn, keys.p4, bonkMint, p4ATA.address, keys.admin, 1000000000_00000),
        ]).then(async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const p1ATA = await getOrCreateAssociatedTokenAccount(conn, keys.p1, bonkMint, keys.p1.publicKey);
            const p2ATA = await getOrCreateAssociatedTokenAccount(conn, keys.p2, bonkMint, keys.p2.publicKey);
            const p3ATA = await getOrCreateAssociatedTokenAccount(conn, keys.p3, bonkMint, keys.p3.publicKey);
            const p4ATA = await getOrCreateAssociatedTokenAccount(conn, keys.p4, bonkMint, keys.p4.publicKey);

            console.log(`
                P1 funded with ${p1ATA.amount / BigInt(1e5)} localbonk,
                P2 funded with ${p2ATA.amount / BigInt(1e5)} localbonk,
                P3 funded with ${p3ATA.amount / BigInt(1e5)} localbonk,
                P4 funded with ${p4ATA.amount / BigInt(1e5)} localbonk
            `)
        })
    })

program
    .command("init-game")
    .description("Initializes a game with default values")
    .argument("<gameId>", "id to initalize the game with")
    .action(async (id: string) => {
        const ix = await lib.initGame({ gameId: new BN(id) });
        const tx = new VersionedTransaction(new TransactionMessage({
            payerKey: keys.admin.publicKey,
            recentBlockhash: (await conn.getLatestBlockhash()).blockhash,
            instructions: [ix],
        }).compileToLegacyMessage());
        tx.sign([keys.admin]);
        const txnSig = await conn.sendRawTransaction(tx.serialize())
        console.log(`Initialized game: ${txnSig}`);
    });

program
    .command("join-game")
    .argument("<gameId>", "gameId")
    .argument("<p1-4>", "player 1-4 to use this instruction with")
    .action(async (id: string, pn: string) => {
        const ix = await lib.joinGame(new BN(id), keys[pn].publicKey);
        const tx = new VersionedTransaction(new TransactionMessage({
            payerKey: keys[pn].publicKey,
            recentBlockhash: (await conn.getLatestBlockhash()).blockhash,
            instructions: [ix],
        }).compileToLegacyMessage());
        tx.sign([keys[pn]]);
        try {
            const txnSig = await conn.sendRawTransaction(tx.serialize());
            console.log(`Joined Game: ${txnSig}`)
        } catch (e: any) {
            console.error(`ERROR: ${e.message}`)
        }
    });

program
    .command("create-offer")
    .argument("<gameId>", "gameId")
    .argument("<p1-4>", "player 1-4 to use this instruction with")
    .argument("<offering>", "w#s#o#b#d#")
    .argument("<accepting>", "w#s#o#b#d#")
    .action(async (id: string, pn: string, offering: string, accepting: string) => {
        const ix = await lib.createOffer(new BN(id), keys[pn].publicKey, parseResources(offering), parseResources(accepting))
        const tx = new VersionedTransaction(new TransactionMessage({
            payerKey: keys[pn].publicKey,
            recentBlockhash: (await conn.getLatestBlockhash()).blockhash,
            instructions: [ix],
        }).compileToLegacyMessage());
        tx.sign([keys[pn]]);
        try {
            const txnSig = await conn.sendRawTransaction(tx.serialize());
            console.log(`Made Offer: ${txnSig}`)
        } catch (e: any) {
            console.error(`ERROR: ${e.message}`)
        }
    });

program
    .command("accept-offer")
    .argument("<gameId>", "gameId")
    .argument("<p1-4>", "player 1-4 to use this instruction with")
    .argument("<offerId>", "offer id to accept")
    .action(async (id: string, pn: string, offerId: string) => {
        const ix = await lib.acceptOffer(new BN(id), keys[pn].publicKey, new BN(offerId));
        const tx = new VersionedTransaction(new TransactionMessage({
            payerKey: keys[pn].publicKey,
            recentBlockhash: (await conn.getLatestBlockhash()).blockhash,
            instructions: [ix],
        }).compileToLegacyMessage());
        tx.sign([keys[pn]]);
        try {
            const txnSig = await conn.sendRawTransaction(tx.serialize());
            console.log(`Joined Game: ${txnSig}`)
        } catch (e: any) {
            console.error(`ERROR: ${e.message}`)
        }
    });

program
    .command("close-offer")
    .argument("<gameId>", "gameId")
    .argument("<p1-4>", "player 1-4 to use this instruction with")
    .argument("<offerId>", "offer id to accept")
    .action(async (id: string, pn: string, offerId: string) => {
        const ix = await lib.closeOffer(new BN(id), keys[pn].publicKey, new BN(offerId));
        const tx = new VersionedTransaction(new TransactionMessage({
            payerKey: keys[pn].publicKey,
            recentBlockhash: (await conn.getLatestBlockhash()).blockhash,
            instructions: [ix],
        }).compileToLegacyMessage());
        tx.sign([keys[pn]]);
        try {
            const txnSig = await conn.sendRawTransaction(tx.serialize());
            console.log(`Joined Game: ${txnSig}`)
        } catch (e: any) {
            console.error(`ERROR: ${e.message}`)
        }
    });

program
    .command("trade-bank")
    .argument("<gameId>", "gameId")
    .argument("<p1-4>", "player 1-4 to use this instruction with")
    .argument("<offering>", "offering resource")
    .argument("<accepting>", "accepting resource")
    .argument("<amount>", "amount of resource to trade")
    .action(async (id: string, pn: string, offering: string, accepting: string, amount: string) => {
        const ix = await lib.tradeBank(new BN(id), keys[pn].publicKey, offering as lib.Resource, accepting as lib.Resource, new BN(amount))
        const tx = new VersionedTransaction(new TransactionMessage({
            payerKey: keys[pn].publicKey,
            recentBlockhash: (await conn.getLatestBlockhash()).blockhash,
            instructions: [ix],
        }).compileToLegacyMessage());
        tx.sign([keys[pn]]);
        try {
            const txnSig = await conn.sendRawTransaction(tx.serialize());
            console.log(`Made Offer: ${txnSig}`)
        } catch (e: any) {
            console.error(`ERROR: ${e.message}`)
        }
    });

program
    .command("take-turn-roll")
    .argument("<gameId>", "gameId")
    .argument("<p1-4>", "player 1-4 to use this instruction with")
    .action(async (id: string, pn: string) => {
        const ix = await lib.takeTurn(new BN(id), keys[pn].publicKey, { type: "roll" });
        const tx = new VersionedTransaction(new TransactionMessage({
            payerKey: keys[pn].publicKey,
            recentBlockhash: (await conn.getLatestBlockhash()).blockhash,
            instructions: [ix],
        }).compileToLegacyMessage());
        tx.sign([keys[pn]]);
        try {
            const txnSig = await conn.sendRawTransaction(tx.serialize());
            console.log(`Joined Game: ${txnSig}`)
        } catch (e: any) {
            console.error(`ERROR: ${e.message}`)
        }
    });

program
    .command("take-turn-settle")
    .argument("<gameId>", "gameId")
    .argument("<p1-4>", "player 1-4 to use this instruction with")
    .action(async (id: string, pn: string) => {
        const ix = await lib.takeTurn(new BN(id), keys[pn].publicKey, { type: "settle" });
        const tx = new VersionedTransaction(new TransactionMessage({
            payerKey: keys[pn].publicKey,
            recentBlockhash: (await conn.getLatestBlockhash()).blockhash,
            instructions: [ix],
        }).compileToLegacyMessage());
        tx.sign([keys[pn]]);
        try {
            const txnSig = await conn.sendRawTransaction(tx.serialize());
            console.log(`Joined Game: ${txnSig}`)
        } catch (e: any) {
            console.error(`ERROR: ${e.message}`)
        }
    });

program
    .command("take-turn-upgrade")
    .argument("<gameId>", "gameId")
    .argument("<p1-4>", "player 1-4 to use this instruction with")
    .argument("<settlementIdx>", "tile you want to upgrade")
    .argument("<structure>", "type of structure")
    .action(async (id: string, pn: string, sIdx: string, structure: string) => {
        const ix = await lib.takeTurn(new BN(id), keys[pn].publicKey, { type: "upgrade", upgradeInfo: { settlementIdx: Number(sIdx), structure: structure as "cathedral" | "city" | "factory" } });
        const tx = new VersionedTransaction(new TransactionMessage({
            payerKey: keys[pn].publicKey,
            recentBlockhash: (await conn.getLatestBlockhash()).blockhash,
            instructions: [ix],
        }).compileToLegacyMessage());
        tx.sign([keys[pn]]);
        try {
            const txnSig = await conn.sendRawTransaction(tx.serialize());
            console.log(`Joined Game: ${txnSig}`)
        } catch (e: any) {
            console.error(`ERROR: ${e.message}`)
        }
    });

program
    .command("claim-resources")
    .argument("<gameId>", "gameId")
    .argument("<p1-4>", "player 1-4 to use this instruction with")
    .action(async (id: string, pn: string) => {
        const ix = await lib.claimResources(new BN(id), keys[pn].publicKey);
        const tx = new VersionedTransaction(new TransactionMessage({
            payerKey: keys[pn].publicKey,
            recentBlockhash: (await conn.getLatestBlockhash()).blockhash,
            instructions: [ix],
        }).compileToLegacyMessage());
        tx.sign([keys[pn]]);
        try {
            const txnSig = await conn.sendRawTransaction(tx.serialize());
            console.log(`Joined Game: ${txnSig}`)
        } catch (e: any) {
            console.error(`ERROR: ${e.message}`)
        }
    });

program
    .command("claim-victory")
    .argument("<gameId>", "gameId")
    .argument("<p1-4>", "player 1-4 to use this instruction with")
    .action(async (id: string, pn: string) => {
        const ix = await lib.claimVictory(new BN(id), keys[pn].publicKey);
        const tx = new VersionedTransaction(new TransactionMessage({
            payerKey: keys[pn].publicKey,
            recentBlockhash: (await conn.getLatestBlockhash()).blockhash,
            instructions: [ix],
        }).compileToLegacyMessage());
        tx.sign([keys[pn]]);
        try {
            const txnSig = await conn.sendRawTransaction(tx.serialize());
            console.log(`Joined Game: ${txnSig}`)
        } catch (e: any) {
            console.error(`ERROR: ${e.message}`)
        }
    });

program
    .command("start-listeners")
    .argument("<gameId>", "game id to listen to")
    .action(async (id: string) => {
        const gameId = new BN(id);
        while (true) {
            // Print Game State
            const game = await lib.getGameAccount(gameId);
            const slot = await conn.getSlot();
            const slotsElapsed = new BN(slot).sub(game.slotLastTurnTaken);
            const stepsElapsed = slotsElapsed.div(game.config.stepSlots);
            const currentPrice = game.config.auctionTokensStart.sub((stepsElapsed.mul(game.config.stepTokens))).div(new BN(1e5));
            console.log(`
                GameID: ${id}
                Winnig Player: ${game.winningPlayer?.playerPda.toBuffer()} | Points: ${game.winningPlayer?.points.toString()} 
                Last Turn Taken: ${game.slotLastTurnTaken} | Current Slot: ${slot} | Slots Per Step: ${game.config.stepSlots} | Step Reduction ${game.config.stepTokens}
                Current Turn Price: ${currentPrice} tokens
            `)

            // Print Rolls Length
            const rolls = await lib.getRollsAccount(gameId);
            console.log(`
                Global Turns Taken: ${rolls.rolls.length}    
            `)

            // Print Each Players Information
            const players = ["1", "2", "3", "4"]
            for (let player of players) {
                const p = await lib.getPlayerAccount(gameId, keys[`p${player}`].publicKey);
                console.log(`
                    Player ${player} (${p.victoryPoints.toString()}) | Free Settlements: ${p.freeSettlements} | Last Roll Claimed: ${p.lastRollClaimed.toString()}
                    W: ${p.resources.wheat.toString()} | S: ${p.resources.sheep.toString()} | O: ${p.resources.ore.toString()}| B: ${p.resources.brick.toString()} | D: ${p.resources.wood.toString()}
                    Settlements: ${p.settlements.map((s, idx) => { return `${idx}:${s}` })}
                `)
            }

            const market = await lib.getMarket(gameId);
            console.log(`Market: ${market}`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    })

program.parse();

function parseResources(rStr: string): lib.Resources {
    return {
        wheat: new BN(rStr.split("w")[1].split("s")[0]),
        sheep: new BN(rStr.split("s")[1].split("o")[0]),
        ore: new BN(rStr.split("o")[1].split("b")[0]),
        brick: new BN(rStr.split("b")[1].split("d")[0]),
        wood: new BN(rStr.split("d")[1]),
    }
} //w#s#o#b#d#