const SCENE = {
  HOME: 'home',
  HOME_2048_MODE: 'home_2048_mode',
  GAME_2048: 'game_2048',
  GAME_POPSTAR: 'game_popstar',
  POPSTAR_CONFIRM: 'popstar_confirm',
  GAME_WATERSORT: 'game_watersort',
  WATERSORT_CONFIRM: 'watersort_confirm',
  LEADERBOARD: 'leaderboard'
};

const GAME_TYPES = {
  GAME_2048: '2048',
  POPSTAR: 'popstar',
  WATERSORT: 'watersort'
};

const GAME_TYPE_MAP = {
  '4x4': '2048-4x4',
  '5x5': '2048-5x5',
  '6x6': '2048-6x6',
  'popstar': 'popstar',
  'watersort': 'watersort'
};

module.exports = {
  SCENE,
  GAME_TYPES,
  GAME_TYPE_MAP
};
