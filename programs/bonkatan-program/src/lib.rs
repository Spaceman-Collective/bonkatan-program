use anchor_lang::prelude::*;

declare_id!("9yF172qVQ473EwXCn9GkkCafxTEtD72HFBngLpxmwaHw");

mod instructions;
mod state;
use instructions::*;
use state::PlayerPDA::Resources;
use state::*;
mod constant;
use constant::*;

#[program]
pub mod bonkatan_program {

    use super::*;

    // Initialize Game
    // Create Lobby > Join Lobby > Start Lobby > Destroy Lobby
    pub fn create_lobby(
        ctx: Context<CreateLobby>,
        game_id: u64,
        config: Config,
        tiles: [Tile; TOTAL_TILES],
    ) -> Result<()> {
        instructions::init_game::create_lobby(ctx, game_id, config, tiles)
    }
    pub fn destroy_lobby(ctx: Context<DestroyLobby>) -> Result<()> {
        instructions::init_game::destroy_lobby(ctx)
    }

    pub fn join_lobby(ctx: Context<JoinLobby>) -> Result<()> {
        instructions::init_game::join_lobby(ctx)
    }

    // Trade Resources between Players
    // Create Offer (don't allow bad trades (resource can only appear on one side of the trade)) > Accept Offer
    // Also allow deleting offers
    // When a trade is created, subtract those resources from the offering player so they can't create multiple trades on it
    // And so when the offer is accept it's always creditable
    pub fn create_offer(
        ctx: Context<CreateOffer>,
        offering_resources: Resources,
        accepting_resources: Resources,
        offer_id: u64,
    ) -> Result<()> {
        instructions::trade::create_offer(ctx, offering_resources, accepting_resources, offer_id)
    }
    pub fn accept_offer(ctx: Context<AcceptOffer>, offer_id: u64) -> Result<()> {
        instructions::trade::accept_offer(ctx, offer_id)
    }
    pub fn close_offer(ctx: Context<CloseOffer>, offer_id: u64) -> Result<()> {
        instructions::trade::close_offer(ctx, offer_id)
    }
    pub fn trade_bank(
        ctx: Context<TradeBank>,
        offering: Resource,
        recieving: Resource,
        batches: u64,
    ) -> Result<()> {
        instructions::trade::trade_bank(ctx, offering, recieving, batches)
    }

    // Take a Turn
    // TakeTurn
    // Claim Resource (update highest roll accepted) (do the upgrade)
    // Update VP, if higher than highest VP, then add to player count
    pub fn take_turn(ctx: Context<TakeTurn>, turn: Turn) -> Result<()> {
        instructions::turn::take_turn(ctx, turn)
    }
    pub fn claim_resources(ctx: Context<ClaimResources>) -> Result<()> {
        instructions::claim::claim_resources(ctx)
    }

    // Confirm Victory
    pub fn claim_victory(ctx: Context<ClaimVictory>) -> Result<()> {
        instructions::victory::claim_victory(ctx)
    }
}
