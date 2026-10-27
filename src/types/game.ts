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
  host_plays: boolean;
  host_sees_money: boolean;
  shots_per_turn: number; // 0 = unlimited
  approve_shots: boolean;
  host_shoots: boolean;
  shots_used: number;
  pending_shot: PendingShot | null;
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
  status: 'active' | 'pending' | 'kicked';
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

export interface PendingShot {
  attacker_id: string;
  target_id: string;
  x: number;
  y: number;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const colLabel = (x: number) => LETTERS[x] ?? String(x + 1);
export const coordLabel = (x: number, y: number) => `${colLabel(x)}${y + 1}`;

/** Players who take part in the game (have a board and turns). */
export const gamersOf = (room: Pick<GameRoom, 'host_plays'>, players: GamePlayer[]) =>
  players.filter(p => p.status === 'active' && (room.host_plays || !p.is_host));

export const needsApproval = (room: Pick<GameRoom, 'approve_shots' | 'shots_per_turn'>) =>
  room.approve_shots || room.shots_per_turn === 0;

/** Next player in seat order who is alive, active and has placed coins. */
export const nextTurnAfter = (room: Pick<GameRoom, 'host_plays'>, players: GamePlayer[], currentId: string | null) => {
  const alive = gamersOf(room, players).filter(p => !p.eliminated && p.ready).sort((a, b) => a.seat - b.seat);
  if (alive.length === 0) return null;
  const cur = players.find(p => p.id === currentId);
  const curSeat = cur ? cur.seat : -1;
  return (alive.find(p => p.seat > curSeat) || alive[0]).id;
};

/** Shots-per-turn: after this shot, does the turn pass? */
export const turnEndsAfterShot = (shotsPerTurn: number, shotsUsedBefore: number) =>
  shotsPerTurn > 0 && shotsUsedBefore + 1 >= shotsPerTurn;
