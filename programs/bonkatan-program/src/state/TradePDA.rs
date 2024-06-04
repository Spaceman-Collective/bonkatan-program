use anchor_lang::prelude::*;

use super::Resources;

#[account]
#[derive(InitSpace)]
pub struct Offer {
    pub game_key: Pubkey,
    pub offering_player: Pubkey,
    pub offer_id: u64,
    pub offering_resources: Resources,
    pub accepting_resources: Resources,
}

// seeds = [game_key, offering_player, offer_id]
