import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { program } from 'commander';
import { readFileSync } from 'fs';
import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';

const conn = new Connection("http://localhost:8899", { commitment: "confirmed" });

program
    .name("Bonkatan-CLI")

program
    .command('debug')
    .description("Debug command that does whatever we're testing rn")
    .action(() => {
        console.log("Hello World!");
        console.log(Uint8Array.from(bs58.decode("8rsYeKjBF9dBfQ4SyCroGtMuiCpMUen12zz5eYJuR6p6")).toString())
        console.log(Uint8Array.from(bs58.decode("267JgjracStJYx1uQJ3kbYHbFEjTBRasiiLJQMpyE5Nz")).toString())
    })

// Setup
program
    .command('setup')
    .description("Assumes there's a keys/ folder and funds everyone with localbonk and sol")
    .action(async () => {
        // Fund the Admin Keypair
        const adminKey = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync("./keys/admin.json").toString()) as number[]));
        console.log(`Loaded admin keypair: ${adminKey.publicKey.toString()}`);
        const p1Key = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync("./keys/p1.json").toString()) as number[]));
        console.log(`Loaded p1 keypair: ${p1Key.publicKey.toString()}`);
        const p2Key = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync("./keys/p2.json").toString()) as number[]));
        console.log(`Loaded p2 keypair: ${p2Key.publicKey.toString()}`);
        const p3Key = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync("./keys/p3.json").toString()) as number[]));
        console.log(`Loaded p3 keypair: ${p3Key.publicKey.toString()}`);
        const p4Key = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync("./keys/p4.json").toString()) as number[]));
        console.log(`Loaded p4 keypair: ${p4Key.publicKey.toString()}`);
        await Promise.all([
            conn.requestAirdrop(adminKey.publicKey, 10 * LAMPORTS_PER_SOL),
            conn.requestAirdrop(p1Key.publicKey, 10 * LAMPORTS_PER_SOL),
            conn.requestAirdrop(p2Key.publicKey, 10 * LAMPORTS_PER_SOL),
            conn.requestAirdrop(p3Key.publicKey, 10 * LAMPORTS_PER_SOL),
            conn.requestAirdrop(p4Key.publicKey, 10 * LAMPORTS_PER_SOL),
        ]).then(async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            console.log(`
                Admin funded with ${await conn.getBalance(adminKey.publicKey) / LAMPORTS_PER_SOL} sol
                P1 funded with ${await conn.getBalance(p1Key.publicKey) / LAMPORTS_PER_SOL} sol
                P2 funded with ${await conn.getBalance(p2Key.publicKey) / LAMPORTS_PER_SOL} sol
                P3 funded with ${await conn.getBalance(p3Key.publicKey) / LAMPORTS_PER_SOL} sol
                P4 funded with ${await conn.getBalance(p4Key.publicKey) / LAMPORTS_PER_SOL} sol

            `)
        })

        // Create the Bonk Mint
        const bonkKey = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync("./keys/bonk_mint.json").toString()) as number[]));
        console.log(`Loaded bonk keypair: ${bonkKey.publicKey.toString()}`);
        const bonkMint = await createMint(conn, adminKey, adminKey.publicKey, adminKey.publicKey, 5, bonkKey);
        console.log("SPL Token Minted at: ", bonkMint.toString());

        // Fund Players with LocalBonk
        const p1ATA = await getOrCreateAssociatedTokenAccount(conn, p1Key, bonkMint, p1Key.publicKey);
        const p2ATA = await getOrCreateAssociatedTokenAccount(conn, p2Key, bonkMint, p2Key.publicKey);
        const p3ATA = await getOrCreateAssociatedTokenAccount(conn, p3Key, bonkMint, p3Key.publicKey);
        const p4ATA = await getOrCreateAssociatedTokenAccount(conn, p4Key, bonkMint, p4Key.publicKey);

        // Mint 1B tokens to each Player
        await Promise.all([
            mintTo(conn, p1Key, bonkMint, p1ATA.address, adminKey, 1000000000_00000),
            mintTo(conn, p2Key, bonkMint, p2ATA.address, adminKey, 1000000000_00000),
            mintTo(conn, p3Key, bonkMint, p3ATA.address, adminKey, 1000000000_00000),
            mintTo(conn, p4Key, bonkMint, p4ATA.address, adminKey, 1000000000_00000),
        ]).then(async () => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const p1ATA = await getOrCreateAssociatedTokenAccount(conn, p1Key, bonkMint, p1Key.publicKey);
            const p2ATA = await getOrCreateAssociatedTokenAccount(conn, p2Key, bonkMint, p2Key.publicKey);
            const p3ATA = await getOrCreateAssociatedTokenAccount(conn, p3Key, bonkMint, p3Key.publicKey);
            const p4ATA = await getOrCreateAssociatedTokenAccount(conn, p4Key, bonkMint, p4Key.publicKey);

            console.log(`
                P1 funded with ${p1ATA.amount / BigInt(1e5)} localbonk,
                P2 funded with ${p2ATA.amount / BigInt(1e5)} localbonk,
                P3 funded with ${p3ATA.amount / BigInt(1e5)} localbonk,
                P4 funded with ${p4ATA.amount / BigInt(1e5)} localbonk
            `)
        })
    })

program.parse();