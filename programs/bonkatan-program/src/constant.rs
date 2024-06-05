use anchor_lang::prelude::*;

use crate::state::Resources;

pub const TOTAL_TILES: usize = 20;
// pub const ADMIN_ADDRESS: Pubkey = Pubkey::new_from_array([
//     27, 64, 236, 172, 60, 88, 249, 223, 89, 224, 8, 176, 189, 94, 249, 49, 137, 246, 6, 150, 144,
//     222, 45, 109, 193, 131, 243, 61, 96, 230, 78, 173,
// // ]); //2qPRnmigG7KBwnR26djXHdPuYBzBvYEsbZBeoNVeWzqr
// pub const BONK_MINT: Pubkey = Pubkey::new_from_array([
//     188, 7, 197, 110, 96, 173, 61, 63, 23, 115, 130, 234, 198, 84, 143, 186, 31, 211, 44, 253, 144,
//     202, 2, 179, 231, 207, 161, 133, 253, 206, 115, 152,
// ]); //DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263


// TEST KEYS
pub const ADMIN_ADDRESS: Pubkey = Pubkey::new_from_array([
  127, 141,  58, 215, 203, 132, 231, 220,
   88,  89,  44, 138, 119,  12, 190,  13,
   66, 245, 251, 203,  67,  80, 143, 165,
    2,  17,  31, 165, 249, 187, 254, 191
]); //9augZJS7vaLrTVmPEHQ2XZdf98izuc3HRUD3crQuQJQn
pub const BONK_MINT: Pubkey = Pubkey::new_from_array([
   19, 125,  39, 218, 162, 209,  85,  16,
  248,  34,  17, 124, 191,   1,  74, 130,
   94, 173, 236, 130, 219, 125,  85,  76,
   80, 131, 165, 197, 205,  93, 156, 202
]); //2K5SCuqYjLMYuTu8pSRwZb6QFapNG9x4xs8v5KDUrkwj



pub const TOWN_COST: Resources = Resources {
    wheat: 2,
    ore: 0,
    sheep: 2,
    wood: 2,
    brick: 2,
};
pub const TOWN_VP: u64 = 1;

pub const CATHEDRAL_COST: Resources = Resources {
    wheat: 3,
    ore: 0,
    sheep: 3,
    wood: 4,
    brick: 1,
};
pub const CATHEDRAL_VP: u64 = 5;

pub const CITY_COST: Resources = Resources {
    wheat: 4,
    ore: 2,
    sheep: 4,
    wood: 2,
    brick: 4,
};
pub const CITY_VP: u64 = 3;

pub const FACTORY_COST: Resources = Resources {
    wheat: 3,
    ore: 4,
    sheep: 0,
    wood: 3,
    brick: 1,
};
pub const FACTORY_VP: u64 = 1;
