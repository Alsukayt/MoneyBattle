-- Create game_rooms table for managing game sessions
CREATE TABLE public.game_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  grid_size INTEGER NOT NULL DEFAULT 5,
  coin_amount INTEGER NOT NULL DEFAULT 100,
  host_nickname TEXT NOT NULL,
  guest_nickname TEXT,
  host_ready BOOLEAN NOT NULL DEFAULT false,
  guest_ready BOOLEAN NOT NULL DEFAULT false,
  current_turn TEXT, -- 'host' or 'guest'
  game_status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'placing', 'playing', 'finished'
  winner TEXT, -- 'host' or 'guest'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_cells table for tracking money placement and attacks
CREATE TABLE public.game_cells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  player TEXT NOT NULL, -- 'host' or 'guest'
  cell_x INTEGER NOT NULL,
  cell_y INTEGER NOT NULL,
  coins INTEGER NOT NULL DEFAULT 0,
  is_hit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, player, cell_x, cell_y)
);

-- Enable Row Level Security (allow all for now since no auth required)
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_cells ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for public access (no auth required)
CREATE POLICY "Allow all access to game_rooms" ON public.game_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to game_cells" ON public.game_cells FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_cells;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_game_rooms_updated_at
  BEFORE UPDATE ON public.game_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();