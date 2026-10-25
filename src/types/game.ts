export type WinMode = 'last_standing' | 'most_coins';

export interface GameRoom {
  id: string;
  room_code: string;
  grid_size: number;
  coin_amount: number;
  host_nickname: string;
  current_turn: string | null; // player id
  game_status: 'waiting' | 'placing' | 'playing' | 'finished';
  winner: string | null; // player id
  win_mode: WinMode;
  created_at: string;
  updated_at: string;
}

export interface GamePlayer {
  id: string;
  room_id: string;
  nickname: string;
  seat: number;
  is_host: boolean;
  ready: boolean;
  eliminated: boolean;
  coins_collected: number;
}

export interface GameCell {
  id: string;
  room_id: string;
  player: string; // player id
  cell_x: number;
  cell_y: number;
  coins: number;
  is_hit: boolean;
  created_at: string;
}

export interface GameAttack {
  id: string;
  room_id: string;
  attacker_id: string;
  target_id: string;
  cell_x: number;
  cell_y: number;
  hit: boolean;
  coins: number;
}

export interface PlacementCell {
  x: number;
  y: number;
  coins: number;
}
