use anchor_lang::prelude::*;
use anchor_spl::token::{transfer_checked, Mint, Token, TokenAccount, TransferChecked};

use crate::{GamePDA::GamePDA, PlayerPDA::PlayerPDA, ADMIN_ADDRESS, BONK_MINT};

pub fn claim_victory(ctx: Context<ClaimVictory>) -> Result<()> {
    let player = &ctx.accounts.player;
    let game = &ctx.accounts.game;

    if player.victory_points >= game.config.victory_max {
        // Transfer all tokens in token account to player
        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.game_vault.to_account_info(),
                    mint: ctx.accounts.bonk_mint.to_account_info(),
                    to: ctx.accounts.owner_ata.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            ctx.accounts.game_vault.amount,
            5, // BONK is 5 decimals
        )?;
    } else {
        return err!(VictoryErrors::InsufficientVP);
    }
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimVictory<'info> {
    pub owner: Signer<'info>,
    #[account(
        seeds = [
            game.key().as_ref(),
            owner.key().as_ref()
        ],
        bump,
        constraint = player.owner.key() == owner.key()
    )]
    pub player: Account<'info, PlayerPDA>,
    pub system_program: Program<'info, System>,
    #[account(mut, close = admin_account)]
    pub game: Account<'info, GamePDA>,
    #[account(
        mut, 
        seeds=[b"rolls", game.key().as_ref()],
        bump,
        close = admin_account)]
    pub rolls: Account<'info, GamePDA>,
    #[account(mut, address = ADMIN_ADDRESS)]
    /// CHECK: just the admin account getting rent back
    pub admin_account: AccountInfo<'info>,
    // SPL
    #[account(
        mut,
        associated_token::mint = bonk_mint,
        associated_token::authority = owner,
    )]
    pub owner_ata: Account<'info, TokenAccount>,
    #[account(
        address = BONK_MINT
    )]
    pub bonk_mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [b"game-vault", game.key().as_ref()],
        bump,
        token::mint = bonk_mint,
        token::authority = game_vault,
        close = admin_account
    )]
    pub game_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum VictoryErrors {
    #[msg("You can't claim victory yet!")]
    InsufficientVP,
}
