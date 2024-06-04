use crate::{
    constant::{ADMIN_ADDRESS, BONK_MINT, TOTAL_TILES}, state::{Config, GamePDA::GamePDA, Tile}, PlayerPDA::{PlayerPDA, Resources}, RollPDA::RollPDA, Settlement
};
use anchor_lang::prelude::*;
use anchor_spl::{associated_token::{create, AssociatedToken, Create}, token::{Mint, Token, TokenAccount}};

pub fn create_lobby(ctx: Context<CreateLobby>, game_id:u64, config: Config, tiles: [Tile; TOTAL_TILES]) -> Result<()> {
    let game = &mut ctx.accounts.game;
    game.game_id = game_id;
    game.winning_player = None;
    game.config = config;
    game.tiles = tiles; //since this is the admin, tile distribution can be done client side and uploaded
    game.slot_last_turn_taken = game.config.game_start_slot;

    let id_bytes = game_id.to_be_bytes();
    let signer_seeds = &[
        id_bytes.as_slice(),
        &[ctx.bumps.game]
    ];
    create(CpiContext::new_with_signer(
        ctx.accounts.ata_program.to_account_info(),
        Create {
            payer: ctx.accounts.admin.to_account_info(),
            associated_token: ctx.accounts.game_ata.to_account_info(),
            authority: ctx.accounts.game.to_account_info(),
            mint: ctx.accounts.bonk_mint.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info()
        }, 
        &[signer_seeds]))?;
    Ok(())
}

pub fn destroy_lobby(_ctx: Context<DestroyLobby>) -> Result<()> {
    Ok(())
}

pub fn join_lobby(ctx: Context<JoinLobby>) -> Result<()> {
    let player = &mut ctx.accounts.player;
    player.owner = ctx.accounts.owner.key();
    player.free_settlements = 3;
    for i in 0..TOTAL_TILES {
        player.settlements[i] = Settlement {
            structure: None, 
        }
    }
    player.resources = Resources {
        wheat: 0,
        sheep: 0,
        ore: 0,
        wood: 0,
        brick: 0
    };
    player.last_roll_claimed =  None;
    player.victory_points = 0;
    Ok(())
}

#[derive(Accounts)]
#[instruction(game_id:u64, config: Config, tiles: [Tile; TOTAL_TILES])]
pub struct CreateLobby<'info> {
    #[account(
        mut,
        address=ADMIN_ADDRESS
    )]
    pub admin: Signer<'info>,
    #[account(
        init,
        space = 8 + GamePDA::INIT_SPACE,
        seeds=[game_id.to_be_bytes().as_slice()],
        bump,
        payer = admin,
    )]
    // not actually a PDA, can be a wallet account cause no seeds needed, just gen a random keypair
    pub game: Account<'info, GamePDA>,

    #[account(
        init,
        space = 8 + 32 + 5,
        payer=admin,
    )]
    pub roll: Account<'info, RollPDA>,
    #[account()]
    pub system_program: Program<'info, System>,

    // ATA
    pub token_program: Program<'info, Token>,
    pub ata_program: Program<'info, AssociatedToken>,
    #[account(mut)]
    pub game_ata: Account<'info, TokenAccount>,
    #[account(
        address = BONK_MINT
    )]
    pub bonk_mint: Account<'info, Mint>,
}

#[derive(Accounts)]
pub struct DestroyLobby<'info> {
    #[account(
        mut,
        address=ADMIN_ADDRESS
    )]
    pub admin: Signer<'info>,
    #[account(
        mut,
        close = admin
    )]
    pub game: Account<'info, GamePDA>,
}

#[derive(Accounts)]
pub struct JoinLobby<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    pub game: Account<'info, GamePDA>,
    #[account(
        init, 
        space = 8 + PlayerPDA::INIT_SPACE,
        payer=owner,
        seeds=[
            game.key().to_bytes().as_slice(),
            owner.key().to_bytes().as_slice(),
        ],
        bump,
    )]
    pub player: Account<'info, PlayerPDA>,
    pub system_program: Program<'info, System>,
}
