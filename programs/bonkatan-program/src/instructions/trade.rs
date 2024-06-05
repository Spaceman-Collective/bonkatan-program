use crate::{state::{
    GamePDA::GamePDA,
    PlayerPDA::{PlayerPDA, Resources},
    TradePDA::Offer,
}, Resource, BANK_TRADE_AMOUNT};
use anchor_lang::prelude::*;

pub fn create_offer(
    ctx: Context<CreateOffer>,
    offering_resources: Resources,
    accepting_resources: Resources,
    offer_id: u64,
) -> Result<()> {
    // verify offer, (same resources cannot be on both sides. 1 wheat for 2 wheat)
    if offering_resources.wheat > 0 && accepting_resources.wheat > 0 {
        return err!(TradeErrors::InvalidOfferSameResourceType);
    }
    if offering_resources.ore > 0 && accepting_resources.ore > 0 {
        return err!(TradeErrors::InvalidOfferSameResourceType);
    }
    if offering_resources.sheep > 0 && accepting_resources.sheep > 0 {
        return err!(TradeErrors::InvalidOfferSameResourceType);
    }
    if offering_resources.wood > 0 && accepting_resources.wood > 0 {
        return err!(TradeErrors::InvalidOfferSameResourceType);
    }
    if offering_resources.brick > 0 && accepting_resources.brick > 0 {
        return err!(TradeErrors::InvalidOfferSameResourceType);
    }

    // Take resources from player for offer
    let player = &mut ctx.accounts.player;
    if let Some(new_value) = player.resources.wheat.checked_sub(offering_resources.wheat) {
        player.resources.wheat = new_value;
    } else {
        return err!(TradeErrors::InvalidOfferNotEnoughResources);
    }
    if let Some(new_value) = player.resources.ore.checked_sub(offering_resources.ore) {
        player.resources.ore = new_value;
    } else {
        return err!(TradeErrors::InvalidOfferNotEnoughResources);
    }
    if let Some(new_value) = player.resources.sheep.checked_sub(offering_resources.sheep) {
        player.resources.sheep = new_value;
    } else {
        return err!(TradeErrors::InvalidOfferNotEnoughResources);
    }
    if let Some(new_value) = player.resources.wood.checked_sub(offering_resources.wood) {
        player.resources.wood = new_value;
    } else {
        return err!(TradeErrors::InvalidOfferNotEnoughResources);
    }
    if let Some(new_value) = player.resources.brick.checked_sub(offering_resources.brick) {
        player.resources.brick = new_value;
    } else {
        return err!(TradeErrors::InvalidOfferNotEnoughResources);
    }

    let offer = &mut ctx.accounts.offer;
    offer.game_key = ctx.accounts.game.key();
    offer.offering_player = ctx.accounts.owner.key();
    offer.offer_id = offer_id;
    offer.offering_resources = offering_resources;
    offer.accepting_resources = accepting_resources;

    Ok(())
}

pub fn accept_offer(ctx: Context<AcceptOffer>) -> Result<()> {
    let offering_player = &mut ctx.accounts.offering_player;
    let accepting_player = &mut ctx.accounts.accepting_player;
    // take resources from accepting_player and give resources to offering_player
    if let Some(new_value) = accepting_player
        .resources
        .wheat
        .checked_sub(ctx.accounts.offer.accepting_resources.wheat)
    {
        accepting_player.resources.wheat = new_value;

        // give the offering player any of the accepting resource
        if let Some(new_value) = offering_player
            .resources
            .wheat
            .checked_add(ctx.accounts.offer.accepting_resources.wheat)
        {
            offering_player.resources.wheat = new_value;
        } else {
            return err!(TradeErrors::AcceptOfferFailedResourcesOverflow);
        }
    } else {
        return err!(TradeErrors::AcceptOfferFailedNotEnoughResources);
    }
    if let Some(new_value) = accepting_player
        .resources
        .ore
        .checked_sub(ctx.accounts.offer.accepting_resources.ore)
    {
        accepting_player.resources.ore = new_value;
        // give the offering player any of the accepting resource
        if let Some(new_value) = offering_player
            .resources
            .ore
            .checked_add(ctx.accounts.offer.accepting_resources.ore)
        {
            offering_player.resources.ore = new_value;
        } else {
            return err!(TradeErrors::AcceptOfferFailedResourcesOverflow);
        }
    } else {
        return err!(TradeErrors::AcceptOfferFailedNotEnoughResources);
    }
    if let Some(new_value) = accepting_player
        .resources
        .sheep
        .checked_sub(ctx.accounts.offer.accepting_resources.sheep)
    {
        accepting_player.resources.sheep = new_value;
        // give the offering player any of the accepting resource
        if let Some(new_value) = offering_player
            .resources
            .sheep
            .checked_add(ctx.accounts.offer.accepting_resources.sheep)
        {
            offering_player.resources.sheep = new_value;
        } else {
            return err!(TradeErrors::AcceptOfferFailedResourcesOverflow);
        }
    } else {
        return err!(TradeErrors::AcceptOfferFailedNotEnoughResources);
    }
    if let Some(new_value) = accepting_player
        .resources
        .wood
        .checked_sub(ctx.accounts.offer.accepting_resources.wood)
    {
        accepting_player.resources.wood = new_value;
        if let Some(new_value) = offering_player
            .resources
            .wood
            .checked_add(ctx.accounts.offer.accepting_resources.wood)
        {
            offering_player.resources.wood = new_value;
        } else {
            return err!(TradeErrors::AcceptOfferFailedResourcesOverflow);
        }
    } else {
        return err!(TradeErrors::AcceptOfferFailedNotEnoughResources);
    }
    if let Some(new_value) = accepting_player
        .resources
        .brick
        .checked_sub(ctx.accounts.offer.accepting_resources.brick)
    {
        accepting_player.resources.brick = new_value;
        if let Some(new_value) = offering_player
            .resources
            .brick
            .checked_add(ctx.accounts.offer.accepting_resources.brick)
        {
            offering_player.resources.brick = new_value;
        } else {
            return err!(TradeErrors::AcceptOfferFailedResourcesOverflow);
        }
    } else {
        return err!(TradeErrors::AcceptOfferFailedNotEnoughResources);
    }

    // give offered resources to accepting_player
    if let Some(new_value) = accepting_player
        .resources
        .wheat
        .checked_add(ctx.accounts.offer.offering_resources.wheat)
    {
        accepting_player.resources.wheat = new_value;
    } else {
        return err!(TradeErrors::AcceptOfferFailedResourcesOverflow);
    }
    if let Some(new_value) = accepting_player
        .resources
        .ore
        .checked_add(ctx.accounts.offer.offering_resources.ore)
    {
        accepting_player.resources.ore = new_value;
    } else {
        return err!(TradeErrors::AcceptOfferFailedResourcesOverflow);
    }
    if let Some(new_value) = accepting_player
        .resources
        .sheep
        .checked_add(ctx.accounts.offer.offering_resources.sheep)
    {
        accepting_player.resources.sheep = new_value;
    } else {
        return err!(TradeErrors::AcceptOfferFailedResourcesOverflow);
    }
    if let Some(new_value) = accepting_player
        .resources
        .wood
        .checked_add(ctx.accounts.offer.offering_resources.wood)
    {
        accepting_player.resources.wood = new_value;
    } else {
        return err!(TradeErrors::AcceptOfferFailedResourcesOverflow);
    }
    if let Some(new_value) = accepting_player
        .resources
        .brick
        .checked_add(ctx.accounts.offer.offering_resources.brick)
    {
        accepting_player.resources.brick = new_value;
    } else {
        return err!(TradeErrors::AcceptOfferFailedResourcesOverflow);
    }

    // close the offer account
    // Zero out offer, necessary?
    let offer = &mut ctx.accounts.offer;
    let zeroed_resources = Resources {
        wheat: 0,
        ore: 0,
        sheep: 0,
        wood: 0,
        brick: 0,
    };
    offer.offering_resources = zeroed_resources;
    offer.accepting_resources = zeroed_resources;

    Ok(())
}

pub fn close_offer(ctx: Context<CloseOffer>) -> Result<()> {
    // give resources back to player
    let player = &mut ctx.accounts.offering_player;
    if let Some(new_value) = player
        .resources
        .wheat
        .checked_add(ctx.accounts.offer.offering_resources.wheat)
    {
        player.resources.wheat = new_value;
    } else {
        return err!(TradeErrors::CloseOfferFailedResourcesOverflow);
    }
    if let Some(new_value) = player
        .resources
        .ore
        .checked_add(ctx.accounts.offer.offering_resources.ore)
    {
        player.resources.ore = new_value;
    } else {
        return err!(TradeErrors::CloseOfferFailedResourcesOverflow);
    }
    if let Some(new_value) = player
        .resources
        .sheep
        .checked_add(ctx.accounts.offer.offering_resources.sheep)
    {
        player.resources.sheep = new_value;
    } else {
        return err!(TradeErrors::CloseOfferFailedResourcesOverflow);
    }
    if let Some(new_value) = player
        .resources
        .wood
        .checked_add(ctx.accounts.offer.offering_resources.wood)
    {
        player.resources.wood = new_value;
    } else {
        return err!(TradeErrors::CloseOfferFailedResourcesOverflow);
    }
    if let Some(new_value) = player
        .resources
        .brick
        .checked_add(ctx.accounts.offer.offering_resources.brick)
    {
        player.resources.brick = new_value;
    } else {
        return err!(TradeErrors::CloseOfferFailedResourcesOverflow);
    }

    // Zero out offer, necessary?
    let offer = &mut ctx.accounts.offer;
    let zeroed_resources = Resources {
        wheat: 0,
        ore: 0,
        sheep: 0,
        wood: 0,
        brick: 0,
    };
    offer.offering_resources = zeroed_resources;
    offer.accepting_resources = zeroed_resources;

    Ok(())
}

// A batch is 1 set of (6 - Based on Const) offering resources goes for any 1 recieving resource.
pub fn trade_bank(ctx: Context<TradeBank>, offering: Resource, receiving: Resource, batches: u64) -> Result<()> {
  if batches % BANK_TRADE_AMOUNT != 0 {
    return err!(TradeErrors::InvalidBankTradeAmount);
  }

  let total_offering_amount = if let Some(total_offering_amount) = batches.checked_mul(6) {
    total_offering_amount
  } else {
    return err!(TradeErrors::InvalidBankTradeOfferAmountMultipleOverflow);
  };

  let player = &mut ctx.accounts.player;
  // Withdraw offering resources
  match offering {
    Resource::Wheat => {
      if let Some(new_value) = player.resources.wheat.checked_sub(total_offering_amount) {
        player.resources.wheat = new_value;
      } else {
        return err!(TradeErrors::InvalidBankTradeNotEnoughResources);
      }
    }
    Resource::Brick => {
      if let Some(new_value) = player.resources.brick.checked_sub(total_offering_amount) {
        player.resources.brick = new_value;
      } else {
        return err!(TradeErrors::InvalidBankTradeNotEnoughResources);
      }
    },
    Resource::Wood => {
      if let Some(new_value) = player.resources.wood.checked_sub(total_offering_amount) {
        player.resources.wood = new_value;
      } else {
        return err!(TradeErrors::InvalidBankTradeNotEnoughResources);
      }
    },
    Resource::Sheep => {
      if let Some(new_value) = player.resources.sheep.checked_sub(total_offering_amount) {
        player.resources.sheep = new_value;
      } else {
        return err!(TradeErrors::InvalidBankTradeNotEnoughResources);
      }

    },
    Resource::Ore => {
      if let Some(new_value) = player.resources.ore.checked_sub(total_offering_amount) {
        player.resources.ore = new_value;
      } else {
        return err!(TradeErrors::InvalidBankTradeNotEnoughResources);
      }
    },
  }

  // Deposit recieving resources
  let total_recieving_amount = batches;
  match receiving {
    Resource::Wheat => {
      if let Some(new_value) = player.resources.wheat.checked_add(total_recieving_amount) {
        player.resources.wheat = new_value;
      } else {
        return err!(TradeErrors::InvalidBankTradePlayerResourcesOverflow);
      }
    }
    Resource::Brick => {
      if let Some(new_value) = player.resources.brick.checked_add(total_recieving_amount) {
        player.resources.brick = new_value;
      } else {
        return err!(TradeErrors::InvalidBankTradePlayerResourcesOverflow);
      }
    },
    Resource::Wood => {
      if let Some(new_value) = player.resources.wood.checked_add(total_recieving_amount) {
        player.resources.wood = new_value;
      } else {
        return err!(TradeErrors::InvalidBankTradePlayerResourcesOverflow);
      }
    },
    Resource::Sheep => {
      if let Some(new_value) = player.resources.sheep.checked_add(total_recieving_amount) {
        player.resources.sheep = new_value;
      } else {
        return err!(TradeErrors::InvalidBankTradePlayerResourcesOverflow);
      }

    },
    Resource::Ore => {
      if let Some(new_value) = player.resources.ore.checked_add(total_recieving_amount) {
        player.resources.ore = new_value;
      } else {
        return err!(TradeErrors::InvalidBankTradePlayerResourcesOverflow);
      }
    },
  }


  Ok(())
}

#[derive(Accounts)]
pub struct CreateOffer<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        space = 8 + Offer::INIT_SPACE,
        payer = owner,
        seeds = [],
        bump,
    )]
    pub offer: Account<'info, Offer>,
    #[account(
      mut,
        seeds=[
            game.key().as_ref(),
            owner.key().as_ref()
        ],
        bump,
    )]
    pub player: Account<'info, PlayerPDA>,
    pub game: Account<'info, GamePDA>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcceptOffer<'info> {
    pub owner: Signer<'info>,
    #[account(
      mut,
      seeds = [],
      bump
    )]
    pub offer: Account<'info, Offer>,
    #[account(
      mut,
      constraint = offer.offering_player == offering_player.owner,
    )]
    pub offering_player: Account<'info, PlayerPDA>,
    #[account(
      mut,
      constraint = *owner.key == accepting_player.owner,
    )]
    pub accepting_player: Account<'info, PlayerPDA>,
    pub game: Account<'info, GamePDA>,
}

#[derive(Accounts)]
pub struct CloseOffer<'info> {
    pub owner: Signer<'info>,
    #[account(
      mut,
      constraint = offer.game_key == game.key(),
      seeds = [],
      bump
    )]
    pub offer: Account<'info, Offer>,
    #[account(
      mut,
      constraint = offer.offering_player == offering_player.owner,
      constraint = offering_player.owner == *owner.key,
    )]
    pub offering_player: Account<'info, PlayerPDA>,
    pub game: Account<'info, GamePDA>,
}

#[derive(Accounts)]
pub struct TradeBank<'info> {
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
    pub game: Account<'info, GamePDA>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum TradeErrors {
    #[msg("Invalid offer, not enough resources.")]
    InvalidOfferNotEnoughResources,
    #[msg("Invalid offer, cannot offer and accept the same resource type.")]
    InvalidOfferSameResourceType,
    #[msg("Failed to accept offer, player resources overflow.")]
    AcceptOfferFailedResourcesOverflow,
    #[msg("Failed to accept offer, not enough resources.")]
    AcceptOfferFailedNotEnoughResources,
    #[msg("Failed to close offer, player resources overflow.")]
    CloseOfferFailedResourcesOverflow,
    #[msg("Invalid bank trade, trade amount must be a multiple of 6.")]
    InvalidBankTradeAmount,
    #[msg("Invalid bank trade, player does not have enough resources")]
    InvalidBankTradeNotEnoughResources,
    #[msg("Invalid bank trade, amount multiplier overflowed")]
    InvalidBankTradeOfferAmountMultipleOverflow,
    #[msg("Invalid bank trade, player resources overflowed")]
    InvalidBankTradePlayerResourcesOverflow
}
