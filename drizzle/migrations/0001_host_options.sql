ALTER TABLE public.game_rooms
  ADD COLUMN host_plays boolean NOT NULL DEFAULT true,
  ADD COLUMN host_sees_money boolean NOT NULL DEFAULT false,
  ADD COLUMN shots_per_turn integer NOT NULL DEFAULT 1,
  ADD COLUMN approve_shots boolean NOT NULL DEFAULT false,
  ADD COLUMN host_shoots boolean NOT NULL DEFAULT false,
  ADD COLUMN shots_used integer NOT NULL DEFAULT 0,
  ADD COLUMN pending_shot jsonb;
ALTER TABLE public.game_players ADD COLUMN status text NOT NULL DEFAULT 'active';