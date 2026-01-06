export interface GameRoom {
  id: string;
  room_code: string;
  grid_size: number;
  coin_amount: number;
  host_nickname: string;
  guest_nickname: string | null;
  host_ready: boolean;
  guest_ready: boolean;
  current_turn: 'host' | 'guest' | null;
  game_status: 'waiting' | 'placing' | 'playing' | 'finished';
  winner: 'host' | 'guest' | null;
  created_at: string;
  updated_at: string;
}

export interface GameCell {
  id: string;
  room_id: string;
  player: 'host' | 'guest';
  cell_x: number;
  cell_y: number;
  coins: number;
  is_hit: boolean;
  created_at: string;
}

export type PlayerRole = 'host' | 'guest';

export interface PlacementCell {
  x: number;
  y: number;
  coins: number;
}
