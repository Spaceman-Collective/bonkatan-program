use anchor_lang::prelude::*;

/**
 * takes in a game_id:u64 (random) and creates a GamePDA
*/
pub fn create_lobby(ctx: Context<CreateLobby>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct CreateLobby<'info> {
    pub signer: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct GamePDA {
    pub game_id: u64,
}
