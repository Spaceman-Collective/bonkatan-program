use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::*;
use anchor_spl::token::{transfer_checked, Mint, Token, TokenAccount, TransferChecked};

use crate::constant::BONK_MINT;
use crate::state::Resources;
use crate::GamePDA::GamePDA;
use crate::PlayerPDA::PlayerPDA;
use crate::RollPDA::RollPDA;
use crate::{
    Structure, WinningPlayer, CATHEDRAL_COST, CATHEDRAL_VP, CITY_COST, CITY_VP, FACTORY_COST,
    FACTORY_VP, TOTAL_TILES, TOWN_COST, TOWN_VP,
};

pub fn take_turn(ctx: Context<TakeTurn>, turn: Turn) -> Result<()> {
    let player = &mut ctx.accounts.player;
    let game = &mut ctx.accounts.game;
    let rolls = &mut ctx.accounts.rolls;
    // Check if there's any rolls unclaimed, don't allow turns until all rolls have been claimed
    if rolls.rolls.len() > 0 && player.last_roll_claimed.is_none() {
        return err!(TurnErrors::UnclaimedRollsError);
    } else if rolls.rolls.len() > 0 && player.last_roll_claimed.unwrap() < rolls.rolls.len() as u64
    {
        return err!(TurnErrors::UnclaimedRollsError);
    }
    // Take out BONK tokens for the turn
    let clock = Clock::get().unwrap();
    let slots_elapsed = clock.slot - game.slot_last_turn_taken;
    let steps_elapsed = slots_elapsed / game.config.step_slots;
    let amount = game.config.auction_tokens_start - (steps_elapsed * game.config.step_tokens);

    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.owner_ata.to_account_info(),
                mint: ctx.accounts.bonk_mint.to_account_info(),
                to: ctx.accounts.game_vault.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        ),
        amount,
        5, // BONK is 5 decimals
    )?;

    // Add the roll to ROLL pda
    let roll = get_random_u64(TOTAL_TILES as u64);
    rolls.rolls.push(roll as u8);

    // modify structure on player pda
    match turn {
        Turn::Roll {} => {
            //nothing needs to be done here, they just wanted to increment resources
        }
        Turn::Settle {} => {
            //settle random tile, if taken, settle next open, if all 20 taken, then do nothing
            // settling costs resources unless it's a free settlement
            let random_tile = get_random_u64(TOTAL_TILES as u64) as u8;
            if player.settlements[random_tile as usize].structure.is_none() {
                // Subtract TOWN resource COSTS if no more free settlements, else subtract a free settlement
                if player.free_settlements > 0 {
                    player.free_settlements -= 1;
                } else {
                    //subtract Settlement costs
                    if let Some(new_value) = player.resources.wheat.checked_sub(TOWN_COST.wheat) {
                        player.resources.wheat = new_value;
                    } else {
                        return err!(TurnErrors::InsufficientResources);
                    }

                    if let Some(new_value) = player.resources.ore.checked_sub(TOWN_COST.ore) {
                        player.resources.wheat = new_value;
                    } else {
                        return err!(TurnErrors::InsufficientResources);
                    }

                    if let Some(new_value) = player.resources.sheep.checked_sub(TOWN_COST.sheep) {
                        player.resources.wheat = new_value;
                    } else {
                        return err!(TurnErrors::InsufficientResources);
                    }

                    if let Some(new_value) = player.resources.brick.checked_sub(TOWN_COST.brick) {
                        player.resources.wheat = new_value;
                    } else {
                        return err!(TurnErrors::InsufficientResources);
                    }

                    if let Some(new_value) = player.resources.wood.checked_sub(TOWN_COST.wood) {
                        player.resources.wheat = new_value;
                    } else {
                        return err!(TurnErrors::InsufficientResources);
                    }
                }
                player.settlements[random_tile as usize].structure = Some(crate::Structure::Town);
                // boost VP
                player.victory_points += TOWN_VP;
            } else {
                // something is already there, look for next available tile
                let mut tile_to_modify: Option<usize> = None;
                for i in random_tile..TOTAL_TILES as u8 {
                    if player.settlements[i as usize].structure.is_none() {
                        tile_to_modify = Some(i as usize);
                        break;
                    }
                }
                if tile_to_modify.is_none() {
                    //wrap around
                    for i in 0..random_tile {
                        if player.settlements[i as usize].structure.is_none() {
                            tile_to_modify = Some(i as usize);
                            break;
                        }
                    }
                }
                if tile_to_modify.is_none() {
                    //no empty tiles found, do nothing and process as if it were just a roll
                } else {
                    // Subtract TOWN resource COSTS if no more free settlements, else subtract a free settlement
                    if player.free_settlements > 0 {
                        player.free_settlements -= 1;
                    } else {
                        //subtract Settlement costs
                        if let Some(new_value) = player.resources.wheat.checked_sub(TOWN_COST.wheat)
                        {
                            player.resources.wheat = new_value;
                        } else {
                            return err!(TurnErrors::InsufficientResources);
                        }

                        if let Some(new_value) = player.resources.ore.checked_sub(TOWN_COST.ore) {
                            player.resources.wheat = new_value;
                        } else {
                            return err!(TurnErrors::InsufficientResources);
                        }

                        if let Some(new_value) = player.resources.sheep.checked_sub(TOWN_COST.sheep)
                        {
                            player.resources.wheat = new_value;
                        } else {
                            return err!(TurnErrors::InsufficientResources);
                        }

                        if let Some(new_value) = player.resources.brick.checked_sub(TOWN_COST.brick)
                        {
                            player.resources.wheat = new_value;
                        } else {
                            return err!(TurnErrors::InsufficientResources);
                        }

                        if let Some(new_value) = player.resources.wood.checked_sub(TOWN_COST.wood) {
                            player.resources.wheat = new_value;
                        } else {
                            return err!(TurnErrors::InsufficientResources);
                        }
                    }
                    player.settlements[tile_to_modify.unwrap() as usize].structure =
                        Some(crate::Structure::Town);
                    // boost VP
                    player.victory_points += TOWN_VP;
                }
            }
        }
        Turn::Upgrade {
            settlment_idx,
            structure,
        } => {
            // use resources to build on the settlement if you have atleast a town on it
            if player.settlements[settlment_idx as usize]
                .structure
                .is_none()
            {
                return err!(TurnErrors::UnsettledTile);
            }
            let resources_to_subtract: Resources;
            let vp_to_add: u64;
            match structure {
                Structure::Town => {
                    resources_to_subtract = TOWN_COST;
                    vp_to_add = TOWN_VP;
                }
                Structure::Cathedral => {
                    resources_to_subtract = CATHEDRAL_COST;
                    vp_to_add = CATHEDRAL_VP;
                }
                Structure::City => {
                    resources_to_subtract = CITY_COST;
                    vp_to_add = CITY_VP;
                }
                Structure::Factory => {
                    resources_to_subtract = FACTORY_COST;
                    vp_to_add = FACTORY_VP;
                }
            }

            if let Some(new_value) = player
                .resources
                .wheat
                .checked_sub(resources_to_subtract.wheat)
            {
                player.resources.wheat = new_value;
            } else {
                return err!(TurnErrors::InsufficientResources);
            }

            if let Some(new_value) = player.resources.ore.checked_sub(resources_to_subtract.ore) {
                player.resources.wheat = new_value;
            } else {
                return err!(TurnErrors::InsufficientResources);
            }

            if let Some(new_value) = player
                .resources
                .sheep
                .checked_sub(resources_to_subtract.sheep)
            {
                player.resources.wheat = new_value;
            } else {
                return err!(TurnErrors::InsufficientResources);
            }

            if let Some(new_value) = player
                .resources
                .brick
                .checked_sub(resources_to_subtract.brick)
            {
                player.resources.wheat = new_value;
            } else {
                return err!(TurnErrors::InsufficientResources);
            }

            if let Some(new_value) = player
                .resources
                .wood
                .checked_sub(resources_to_subtract.wood)
            {
                player.resources.wheat = new_value;
            } else {
                return err!(TurnErrors::InsufficientResources);
            }

            player.victory_points += vp_to_add;
            if game.winning_player.is_none() {
                game.winning_player = Some(WinningPlayer {
                    player_pda: player.key(),
                    points: player.victory_points,
                })
            } else if game.winning_player.is_some() {
                if player.victory_points >= game.winning_player.as_ref().unwrap().points {
                    game.winning_player = Some(WinningPlayer {
                        player_pda: player.key(),
                        points: player.victory_points,
                    })
                }
            }
        }
    }
    Ok(())
}

#[derive(Accounts)]
pub struct TakeTurn<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds=[
            game.key().as_ref(),
            owner.key().as_ref()
        ],
        bump,
    )]
    pub player: Account<'info, PlayerPDA>,
    #[account(mut)]
    pub game: Account<'info, GamePDA>, //potentially modified if VP changes
    #[account(
        mut,
        realloc = rolls.to_account_info().data_len() + 1, //adding a u8 at the end of rolls
        realloc::payer = owner,
        realloc::zero = false,
        seeds=[b"rolls", game.key().as_ref()],
        bump,
    )]
    pub rolls: Account<'info, RollPDA>,
    pub system_program: Program<'info, System>,

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
      token::authority = game_vault
    )]
    pub game_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum Turn {
    Roll {},   // nothing is built
    Settle {}, // random tile is chosen as their settlement,
    Upgrade {
        settlment_idx: u8,
        structure: Structure,
    }, // upgrade selected tile
}

pub fn get_random_u64(max: u64) -> u64 {
    let clock = Clock::get().unwrap();
    let slice = &hash(&clock.slot.to_be_bytes()).to_bytes()[0..8];
    let num: u64 = u64::from_be_bytes(slice.try_into().unwrap());
    let target = num / (u64::MAX / max);
    return target;
}

#[error_code]
pub enum TurnErrors {
    #[msg("Player has unclaimed rolls!")]
    UnclaimedRollsError,

    #[msg("Not enough resources to build this!")]
    InsufficientResources,

    #[msg("Upgrading requires atleast a town first!")]
    UnsettledTile,
}
