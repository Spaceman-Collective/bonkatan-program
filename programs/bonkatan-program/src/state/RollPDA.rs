use anchor_lang::prelude::*;

#[account]
pub struct RollPDA {
    pub game: Pubkey,
    pub rolls: Vec<u8>,
}
