use anchor_lang::prelude::*;

declare_id!("9yF172qVQ473EwXCn9GkkCafxTEtD72HFBngLpxmwaHw");

#[program]
pub mod bonkatan_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
