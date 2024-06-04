use anchor_lang::prelude::*;

declare_id!("9yF172qVQ473EwXCn9GkkCafxTEtD72HFBngLpxmwaHw");

mod instructions;
use instructions::*;

#[program]
pub mod bonkatan_program {

    use super::*;

    // Initialize Game
    // Create Lobby > Join Lobby > Start Lobby > Destroy Lobby
    pub fn create_lobby(ctx: Context<CreateLobby>) -> Result<()> {
        instructions::init_game::create_lobby(ctx)
    }

    // Trade Resources between Players
    // Create Offer > Accept Offer

    // Take a Turn
    // TakeTurn

    // Confirm Victory
    // Destroy Lobby & Withdraw Pot
}
