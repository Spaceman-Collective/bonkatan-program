import { Program, BN } from '@coral-xyz/anchor';
import { BonkatanProgram } from '../target/types/bonkatan_program';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { randomBytes } from 'crypto';
import { ByteifyEndianess, serializeUint64 } from 'byteify';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
const idl = require("../target/idl/bonkatan_program.json");

const conn = new Connection("http://localhost:8899", { commitment: 'confirmed' });
const bonkatan = new Program<BonkatanProgram>(idl, { connection: conn });
const adminKey = new PublicKey("8rsYeKjBF9dBfQ4SyCroGtMuiCpMUen12zz5eYJuR6p6");
const bonkMint = new PublicKey("267JgjracStJYx1uQJ3kbYHbFEjTBRasiiLJQMpyE5Nz");
const offerDescriminator = Uint8Array.from([
    215,
    88,
    60,
    71,
    170,
    162,
    73,
    229
]);

export async function initGame(args: {
    gameKey?: Keypair,
    gameId?: BN,
    config?: Config,
    tiles?: Tile[]
}) {
    const gameId: BN = args.gameId ? args.gameId : new BN(randomU64().toString());
    console.log("Creating game with ID: ", gameId.toString());
    console.log("at PublicKey: ", args.gameKey.publicKey.toString());
    const currentSlot = await conn.getSlot();
    /**
     * Default
     * Start at 10k tokens, go down every 10s by 100 tokens
     * Win condition is 6 VP, start the game now
     */
    const config: Config = args.config ? args.config : {
        gameStartSlot: new BN(currentSlot), // start the game now
        auctionTokensStart: new BN(10000_00000),
        stepSlots: new BN(20), // ~10s per step
        stepTokens: new BN(100_00000),
        victoryMax: new BN(6),
    }

    let defaultTiles: Tile[] = [
        { tileYield: { sparse: {} }, tileResource: { wheat: {} } },
        { tileYield: { sparse: {} }, tileResource: { wheat: {} } },
        { tileYield: { sparse: {} }, tileResource: { wheat: {} } },
        { tileYield: { sparse: {} }, tileResource: { wheat: {} } },
        { tileYield: { sparse: {} }, tileResource: { wheat: {} } },
        { tileYield: { sparse: {} }, tileResource: { brick: {} } },
        { tileYield: { sparse: {} }, tileResource: { brick: {} } },
        { tileYield: { sparse: {} }, tileResource: { brick: {} } },
        { tileYield: { sparse: {} }, tileResource: { brick: {} } },
        { tileYield: { sparse: {} }, tileResource: { brick: {} } },
        { tileYield: { sparse: {} }, tileResource: { wood: {} } },
        { tileYield: { sparse: {} }, tileResource: { wood: {} } },
        { tileYield: { sparse: {} }, tileResource: { wood: {} } },
        { tileYield: { sparse: {} }, tileResource: { wood: {} } },
        { tileYield: { sparse: {} }, tileResource: { wood: {} } },
        { tileYield: { sparse: {} }, tileResource: { sheep: {} } },
        { tileYield: { sparse: {} }, tileResource: { sheep: {} } },
        { tileYield: { sparse: {} }, tileResource: { sheep: {} } },
        { tileYield: { sparse: {} }, tileResource: { sheep: {} } },
        { tileYield: { sparse: {} }, tileResource: { sheep: {} } },
        { tileYield: { sparse: {} }, tileResource: { ore: {} } },
        { tileYield: { sparse: {} }, tileResource: { ore: {} } },
        { tileYield: { sparse: {} }, tileResource: { ore: {} } },
        { tileYield: { sparse: {} }, tileResource: { ore: {} } },
        { tileYield: { sparse: {} }, tileResource: { ore: {} } },
    ];

    const tiles = args.tiles ? args.tiles : defaultTiles;
    const admin = adminKey;
    const game = PublicKey.findProgramAddressSync([Uint8Array.from(serializeUint64(BigInt(gameId.toString()), { endianess: ByteifyEndianess.BIG_ENDIAN }))], bonkatan.programId)[0];

    return bonkatan
        .methods
        .createLobby(gameId, config, tiles)
        .accountsPartial({ admin, game })
        .instruction()
}

export async function destoryGame(gameId: BN) {
    const game = PublicKey.findProgramAddressSync([Uint8Array.from(serializeUint64(BigInt(gameId.toString()), { endianess: ByteifyEndianess.BIG_ENDIAN }))], bonkatan.programId)[0];

    return bonkatan
        .methods
        .destroyLobby()
        .accountsPartial({ admin: adminKey, game })
        .instruction()
}

export async function joinGame(gameKey: PublicKey, playerPubkey: PublicKey) {
    return bonkatan
        .methods
        .joinLobby()
        .accounts({
            owner: playerPubkey,
            game: gameKey,
        })
        .instruction();
}

export async function createOffer(gameKey: PublicKey, playerPubkey: PublicKey, offer: Resources, want: Resources) {
    const offerId = new BN(randomU64().toString());

    return bonkatan
        .methods
        .createOffer(offer, want, offerId)
        .accounts({
            game: gameKey,
            owner: playerPubkey,
        })
        .instruction();
}

export async function acceptOffer(gameKey: PublicKey, playerPubkey: PublicKey, offerId: BN) {
    return bonkatan
        .methods
        .acceptOffer(offerId)
        .accounts({ game: gameKey, owner: playerPubkey })
        .instruction()
}

export async function closeOffer(gameKey: PublicKey, playerPubkey: PublicKey, offerId: BN) {
    return bonkatan
        .methods
        .closeOffer(offerId)
        .accounts({ game: gameKey, owner: playerPubkey })
        .instruction();
}

export async function tradeBank(gameKey: PublicKey, playerPubkey: PublicKey, offeringResource: Resource, recevingResource: Resource, offeringAmt: BN) {
    let offering: any = {};
    offering[offeringResource] = {}
    let receving: any = {};
    receving[recevingResource] = {};

    return bonkatan
        .methods
        .tradeBank(offering, receving, offeringAmt)
        .accounts({ game: gameKey, owner: playerPubkey })
        .instruction()
}

export async function takeTurn(gameKey: PublicKey, playerPubkey: PublicKey, turnInfo: TurnInfo) {
    let turn: any;

    if (turnInfo.type == "upgrade") {
        let structure: any;
        structure[turnInfo.upgradeInfo.structure] = {}
        turn[turnInfo.type] = {
            settlmentIdx: turnInfo.upgradeInfo.settlementIdx,
            structure
        }
    } else {
        turn[turnInfo.type] = {}
    }

    const ownerAta = await getAssociatedTokenAddress(bonkMint, playerPubkey);

    return bonkatan
        .methods
        .takeTurn(turn)
        .accounts({ game: gameKey, owner: playerPubkey, ownerAta })
        .instruction()
}

export async function claimResources(gameKey: PublicKey, playerPubkey: PublicKey) {
    return bonkatan
        .methods
        .claimResources()
        .accounts({ game: gameKey, owner: playerPubkey })
        .instruction();
}

export async function claimVictory(gameKey: PublicKey, playerPubkey: PublicKey) {
    const ownerAta = await getAssociatedTokenAddress(bonkMint, playerPubkey);

    return bonkatan
        .methods
        .claimVictory()
        .accounts({ game: gameKey, owner: playerPubkey, ownerAta })
        .instruction()
}

export async function getPlayerAccount(gameKey: PublicKey, playerPubkey: PublicKey) {
    const playerPdaAddress = PublicKey.findProgramAddressSync([gameKey.toBuffer(), playerPubkey.toBuffer()], bonkatan.programId)[0];
    return bonkatan.account.playerPda.fetch(playerPdaAddress)
}

export async function getRollsAccount(gameKey: PublicKey) {
    const rollsPDA = PublicKey.findProgramAddressSync([
        Buffer.from("rolls"),
        gameKey.toBuffer()
    ], bonkatan.programId)[0];
    return bonkatan.account.rollPda.fetch(rollsPDA);
}

export async function getMarket(gameKey: PublicKey) {
    return conn.getParsedProgramAccounts(bonkatan.programId, {
        filters: [
            {
                memcmp: {
                    offset: 0,
                    bytes: bs58.encode(offerDescriminator)
                }
            }
        ]
    })
}

export const randomU64 = (): bigint => {
    return BigInt(`0x${randomBytes(8).toString("hex")}`);
}

export interface Config {
    gameStartSlot: BN,
    auctionTokensStart: BN,
    stepTokens: BN,
    stepSlots: BN,
    victoryMax: BN
}

export interface Tile {
    tileYield: any,
    tileResource: any
}

export interface Resources {
    wheat: BN,
    sheep: BN,
    ore: BN,
    brick: BN,
    wood: BN,
}

export type Resource = "wheat" | "sheep" | "ore" | "brick" | "wood";

export interface TurnInfo {
    type: "roll" | "settle" | "upgrade"
    upgradeInfo?: {
        settlementIdx: number,
        structure: "cathedral" | "city" | "factory"
    }
}

