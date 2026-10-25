CREATE TABLE public.game_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  seat integer NOT NULL,
  is_host boolean NOT NULL DEFAULT false,
  ready boolean NOT NULL DEFAULT false,
  eliminated boolean NOT NULL DEFAULT false,
  coins_collected integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_players TO anon, authenticated;
GRANT ALL ON public.game_players TO service_role;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to game_players" ON public.game_players FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.game_attacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  attacker_id uuid NOT NULL,
  target_id uuid NOT NULL,
  cell_x integer NOT NULL,
  cell_y integer NOT NULL,
  hit boolean NOT NULL DEFAULT false,
  coins integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_attacks TO anon, authenticated;
GRANT ALL ON public.game_attacks TO service_role;
ALTER TABLE public.game_attacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to game_attacks" ON public.game_attacks FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.game_rooms ADD COLUMN win_mode text NOT NULL DEFAULT 'last_standing';

ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_attacks;