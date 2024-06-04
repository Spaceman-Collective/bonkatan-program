use crate::constant::TOTAL_TILES;
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PlayerPDA {
    pub game: Pubkey,
    pub owner: Pubkey,
    pub free_settlements: u8, //usually 3, set on init player
    pub settlements: [Settlement; TOTAL_TILES], //they can have max 1 settlement per tile
    pub resources: Resources,
    pub last_roll_claimed: Option<u64>,
    pub victory_points: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Settlement {
    pub structure: Option<Structure>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum Structure {
    Town,      // 1 VP, 1x Resource
    Cathedral, // 5 VP, 0x Resource
    City,      //2 VP, 2x Resource
    Factory,   // 1 VP, 3x Resource
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace)]
pub struct Resources {
    pub wheat: u64,
    pub ore: u64,
    pub sheep: u64,
    pub wood: u64,
    pub brick: u64,
}
