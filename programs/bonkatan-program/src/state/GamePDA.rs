use crate::constant::TOTAL_TILES;
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct GamePDA {
    pub game_id: u64,
    // Current Highest VP
    pub winning_player: Option<WinningPlayer>,
    pub config: Config,
    pub tiles: [Tile; TOTAL_TILES], //20 Tiles, 4 of each of the 5 resources
    pub slot_last_turn_taken: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct WinningPlayer {
    pub player_pda: Pubkey,
    pub points: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Config {
    pub game_start_slot: u64,
    // What is the starting price of the Turn Auction
    pub auction_tokens_start: u64,
    // How many tokens the auction goes down each step
    pub step_tokens: u64,
    // How many slots it takes for each step
    pub step_slots: u64,
    // How many VP to win the game
    pub victory_max: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Tile {
    pub tile_id: u8, //just the index in tile
    pub tile_yield: Yield,
    pub tile_resource: Resource,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum Yield {
    Sparse,
    Normal,
    Rich,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum Resource {
    Wheat,
    Brick,
    Wood,
    Sheep,
    Ore,
}
