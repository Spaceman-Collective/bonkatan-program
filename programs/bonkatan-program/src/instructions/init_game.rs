use crate::{
    constant::{ADMIN_ADDRESS, BONK_MINT, TOTAL_TILES}, state::{Config, GamePDA::GamePDA, Tile}, PlayerPDA::{PlayerPDA, Resources}, RollPDA::RollPDA, Settlement
};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

pub fn create_lobby(ctx: Context<CreateLobby>, game_id:u64, config: Config, tiles: [Tile; TOTAL_TILES]) -> Result<()> {
    // set initial game account state
    let game = &mut ctx.accounts.game;
    game.game_id = game_id;
    game.winning_player = None;
    game.config = config;
    game.tiles = tiles; //since this is the admin, tile distribution can be done client side and uploaded
    game.slot_last_turn_taken = game.config.game_start_slot;

    let rolls = &mut ctx.accounts.rolls;
    rolls.game = game.key();
    rolls.rolls = Vec::new();

    Ok(())
}

pub fn destroy_lobby(_ctx: Context<DestroyLobby>) -> Result<()> {
    Ok(())
}

pub fn join_lobby(ctx: Context<JoinLobby>) -> Result<()> {
    let player = &mut ctx.accounts.player;
    player.game = ctx.accounts.game.key();
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

// TODO: Uncomment address admin and bonk_mint checks

#[derive(Accounts)]
#[instruction(game_id:u64, config: Config, tiles: [Tile; TOTAL_TILES])]
pub struct CreateLobby<'info> {
    #[account(
        mut,
        // address=ADMIN_ADDRESS
    )]
    pub admin: Signer<'info>,
    #[account(
        init,
        space = 8 + GamePDA::INIT_SPACE,
        payer = admin,
    )]
    // not actually a PDA, can be a wallet account cause no seeds needed, just gen a random keypair
    pub game: Box<Account<'info, GamePDA>>,

    #[account(
        init,
        payer=admin,
        space = 8 + 32 + 8,
        seeds=[b"rolls", game_id.to_be_bytes().as_slice()],
        bump,
    )]
    pub rolls: Account<'info, RollPDA>,

    #[account(
        // address = BONK_MINT
    )]
    pub bonk_mint: Account<'info, Mint>,
    #[account(
      init,
      seeds = [b"game-vault", game.key().as_ref()],
      bump,
      payer = admin,
      token::mint = bonk_mint,
      token::authority = game_vault
    )]
    pub game_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
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
