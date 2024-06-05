use crate::state::{
    GamePDA::{GamePDA, Resource, Yield},
    PlayerPDA::{PlayerPDA, Structure},
    RollPDA::RollPDA,
};
use anchor_lang::prelude::*;

pub fn claim_resources(ctx: Context<ClaimResources>) -> Result<()> {
    let last_roll_claimed = if let Some(last_roll_claimed) = ctx.accounts.player.last_roll_claimed {
        last_roll_claimed as usize
    } else {
        0
    };

    let rolls = ctx.accounts.rolls.rolls.clone();

    let player = &mut ctx.accounts.player;
    if last_roll_claimed >= rolls.len() {
        // error all resources already claimed.
        // or just return Ok without modifying resources?
        return err!(ClaimErrors::ClaimFailedAllResourcesClaimed);
    }
    for x in last_roll_claimed..rolls.len() {
        let tile = ctx.accounts.game.tiles[x].clone();
        if let Some(player_settlement) = player.settlements[x].structure.clone() {
            let settlement_multiplier = match player_settlement {
                Structure::Town => 1,
                Structure::Cathedral => {
                    continue;
                }
                Structure::City => 2,
                Structure::Factory => 3,
            };

            let tile_yield: u64 = match tile.tile_yield {
                Yield::Normal => 1,
                Yield::Sparse => 2,
                Yield::Rich => 3,
            };

            if let Some(player_yield) = tile_yield.checked_add(settlement_multiplier) {
                match tile.tile_resource {
                    Resource::Wheat => {
                        if let Some(new_value) = player.resources.wheat.checked_add(player_yield) {
                            player.resources.wheat = new_value;
                        } else {
                            return err!(ClaimErrors::ClaimFailedArithmaticOverflow);
                        }
                    }
                    Resource::Brick => {
                        if let Some(new_value) = player.resources.brick.checked_add(player_yield) {
                            player.resources.brick = new_value;
                        } else {
                            return err!(ClaimErrors::ClaimFailedArithmaticOverflow);
                        }
                    }
                    Resource::Wood => {
                        if let Some(new_value) = player.resources.wood.checked_add(player_yield) {
                            player.resources.wood = new_value;
                        } else {
                            return err!(ClaimErrors::ClaimFailedArithmaticOverflow);
                        }
                    }
                    Resource::Sheep => {
                        if let Some(new_value) = player.resources.sheep.checked_add(player_yield) {
                            player.resources.sheep = new_value;
                        } else {
                            return err!(ClaimErrors::ClaimFailedArithmaticOverflow);
                        }
                    }
                    Resource::Ore => {
                        if let Some(new_value) = player.resources.ore.checked_add(player_yield) {
                            player.resources.ore = new_value;
                        } else {
                            return err!(ClaimErrors::ClaimFailedArithmaticOverflow);
                        }
                    }
                }
            } else {
                return err!(ClaimErrors::ClaimFailedArithmaticOverflow);
            }
        }
    }

    // update players last_roll_claimed
    player.last_roll_claimed = Some(rolls.len() as u64);
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimResources<'info> {
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds=[
            game.key().to_bytes().as_slice(),
            owner.key().to_bytes().as_slice(),
        ],
        bump,
    )]
    pub player: Account<'info, PlayerPDA>,
    #[account(
        seeds=[b"rolls", game.key().as_ref()],
        bump,
    )]
    pub rolls: Account<'info, RollPDA>,
    pub game: Account<'info, GamePDA>,
}

#[error_code]
pub enum ClaimErrors {
    #[msg("Failed to claim resources, arithmatic overflow")]
    ClaimFailedArithmaticOverflow,
    #[msg("Resources already claimed")]
    ClaimFailedAllResourcesClaimed,
}
