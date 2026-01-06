import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameRoom, GameCell, PlayerRole } from '@/types/game';

export const useGameRoom = (roomCode: string | null, playerRole: PlayerRole | null) => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [myCells, setMyCells] = useState<GameCell[]>([]);
  const [opponentCells, setOpponentCells] = useState<GameCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoom = useCallback(async () => {
    if (!roomCode) return;
    
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single();
    
    if (error) {
      setError('Room not found');
      return;
    }
    
    setRoom(data as GameRoom);
  }, [roomCode]);

  const fetchCells = useCallback(async () => {
    if (!room?.id || !playerRole) return;
    
    const { data: allCells } = await supabase
      .from('game_cells')
      .select('*')
      .eq('room_id', room.id);
    
    if (allCells) {
      const typedCells = allCells as GameCell[];
      setMyCells(typedCells.filter(c => c.player === playerRole));
      setOpponentCells(typedCells.filter(c => c.player !== playerRole));
    }
  }, [room?.id, playerRole]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    if (room) {
      fetchCells();
      setLoading(false);
    }
  }, [room, fetchCells]);

  // Realtime subscription for room updates
  useEffect(() => {
    if (!roomCode) return;

    const channel = supabase
      .channel(`room-${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `room_code=eq.${roomCode}`
        },
        (payload) => {
          console.log('Room update:', payload);
          if (payload.new) {
            setRoom(payload.new as GameRoom);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode]);

  // Realtime subscription for cell updates
  useEffect(() => {
    if (!room?.id || !playerRole) return;

    const channel = supabase
      .channel(`cells-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_cells',
          filter: `room_id=eq.${room.id}`
        },
        () => {
          fetchCells();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id, playerRole, fetchCells]);

  const updateRoom = async (updates: Partial<GameRoom>) => {
    if (!room?.id) return;
    
    const { error } = await supabase
      .from('game_rooms')
      .update(updates)
      .eq('id', room.id);
    
    if (error) {
      console.error('Error updating room:', error);
    }
  };

  const placeMoney = async (cells: { x: number; y: number; coins: number }[]) => {
    if (!room?.id || !playerRole) return;

    // Delete existing cells first
    await supabase
      .from('game_cells')
      .delete()
      .eq('room_id', room.id)
      .eq('player', playerRole);

    // Insert new cells
    const cellsToInsert = cells.map(cell => ({
      room_id: room.id,
      player: playerRole,
      cell_x: cell.x,
      cell_y: cell.y,
      coins: cell.coins,
      is_hit: false
    }));

    const { error } = await supabase
      .from('game_cells')
      .insert(cellsToInsert);

    if (error) {
      console.error('Error placing money:', error);
    }
  };

  const attackCell = async (x: number, y: number) => {
    if (!room?.id || !playerRole) return null;
    
    const opponentRole = playerRole === 'host' ? 'guest' : 'host';
    
    // Find and update the opponent's cell
    const { data: hitCell, error } = await supabase
      .from('game_cells')
      .update({ is_hit: true })
      .eq('room_id', room.id)
      .eq('player', opponentRole)
      .eq('cell_x', x)
      .eq('cell_y', y)
      .select()
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error attacking cell:', error);
      return null;
    }

    // Check if opponent lost all money
    const { data: remainingCells } = await supabase
      .from('game_cells')
      .select('coins')
      .eq('room_id', room.id)
      .eq('player', opponentRole)
      .eq('is_hit', false);

    const remainingCoins = remainingCells?.reduce((sum, c) => sum + c.coins, 0) || 0;
    
    if (remainingCoins === 0) {
      // Player wins!
      await updateRoom({ 
        game_status: 'finished', 
        winner: playerRole 
      });
    } else {
      // Switch turns
      await updateRoom({ 
        current_turn: opponentRole 
      });
    }

    return hitCell as GameCell | null;
  };

  return {
    room,
    myCells,
    opponentCells,
    loading,
    error,
    updateRoom,
    placeMoney,
    attackCell,
    refetch: fetchRoom
  };
};
