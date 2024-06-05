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
    116, 200, 107, 145, 245, 30, 100, 235, 14, 189, 65, 65, 34, 140, 145, 243, 155, 122, 254, 175,
    134, 186, 74, 146, 164, 125, 89, 250, 176, 94, 247, 63,
]); //8rsYeKjBF9dBfQ4SyCroGtMuiCpMUen12zz5eYJuR6p6 "simulator/keys/admin.json"

/*Mainnnet
Pubkey::new_from_array([
    27, 64, 236, 172, 60, 88, 249, 223, 89, 224, 8, 176, 189, 94, 249, 49, 137, 246, 6, 150, 144,
    222, 45, 109, 193, 131, 243, 61, 96, 230, 78, 173,
]); //2qPRnmigG7KBwnR26djXHdPuYBzBvYEsbZBeoNVeWzqr
*/

pub const BONK_MINT: Pubkey = Pubkey::new_from_array([
    16, 42, 184, 79, 134, 142, 71, 62, 33, 13, 85, 70, 62, 49, 250, 44, 183, 50, 238, 90, 10, 78,
    213, 35, 92, 154, 159, 114, 74, 6, 26, 243,
]); //267JgjracStJYx1uQJ3kbYHbFEjTBRasiiLJQMpyE5Nz "simulator/keys/bonk_mint.json"
/** Mainnet
Pubkey::new_from_array([
    188, 7, 197, 110, 96, 173, 61, 63, 23, 115, 130, 234, 198, 84, 143, 186, 31, 211, 44, 253, 144,
    202, 2, 179, 231, 207, 161, 133, 253, 206, 115, 152,
]); //DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
*/

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

pub const BANK_TRADE_AMOUNT: u64 = 6;
