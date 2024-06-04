use anchor_lang::prelude::*;

#[account]
pub struct RollPDA {
    pub rolls: Vec<u8>,
}
