import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameRoom, GameCell, GamePlayer, GameAttack } from '@/types/game';

const nextAliveAfter = (players: GamePlayer[], currentId: string | null) => {
  const alive = [...players].filter(p => !p.eliminated).sort((a, b) => a.seat - b.seat);
  if (alive.length === 0) return null;
  const cur = players.find(p => p.id === currentId);
  const curSeat = cur ? cur.seat : -1;
  return (alive.find(p => p.seat > curSeat) || alive[0]).id;
};

export const useGameRoom = (roomCode: string | null, playerId: string | null) => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [myCells, setMyCells] = useState<GameCell[]>([]);
  const [attacks, setAttacks] = useState<GameAttack[]>([]);

  const fetchRoom = useCallback(async () => {
    if (!roomCode) return;
    const { data } = await supabase.from('game_rooms').select('*').eq('room_code', roomCode).single();
    if (data) setRoom(data as unknown as GameRoom);
  }, [roomCode]);

  const fetchPlayers = useCallback(async () => {
    if (!room?.id) return;
    const { data } = await supabase.from('game_players').select('*').eq('room_id', room.id).order('seat');
    if (data) setPlayers(data as GamePlayer[]);
  }, [room?.id]);

  const fetchCells = useCallback(async () => {
    if (!room?.id || !playerId) return;
    const { data } = await supabase.from('game_cells').select('*').eq('room_id', room.id).eq('player', playerId);
    if (data) setMyCells(data as GameCell[]);
  }, [room?.id, playerId]);

  const fetchAttacks = useCallback(async () => {
    if (!room?.id) return;
    const { data } = await supabase.from('game_attacks').select('*').eq('room_id', room.id);
    if (data) setAttacks(data as GameAttack[]);
  }, [room?.id]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);
  useEffect(() => { fetchPlayers(); fetchCells(); fetchAttacks(); }, [fetchPlayers, fetchCells, fetchAttacks]);

  useEffect(() => {
    if (!roomCode) return;
    const channel = supabase
      .channel(`room-${roomCode}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` },
        (payload) => { if (payload.new) setRoom(payload.new as unknown as GameRoom); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomCode]);

  useEffect(() => {
    if (!room?.id) return;
    const f = `room_id=eq.${room.id}`;
    const channel = supabase
      .channel(`room-data-${room.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_players', filter: f }, () => fetchPlayers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_cells', filter: f }, () => fetchCells())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_attacks', filter: f }, () => fetchAttacks())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id, fetchPlayers, fetchCells, fetchAttacks]);

  const updateRoom = async (updates: Record<string, unknown>) => {
    if (!room?.id) return;
    const { error } = await supabase.from('game_rooms').update(updates).eq('id', room.id);
    if (error) console.error('Error updating room:', error);
  };

  const placeMoney = async (cells: { x: number; y: number; coins: number }[]) => {
    if (!room?.id || !playerId) return;
    await supabase.from('game_cells').delete().eq('room_id', room.id).eq('player', playerId);
    const { error } = await supabase.from('game_cells').insert(cells.map(c => ({
      room_id: room.id, player: playerId, cell_x: c.x, cell_y: c.y, coins: c.coins, is_hit: false,
    })));
    if (error) console.error('Error placing money:', error);
  };

  const setReady = async () => {
    if (!room?.id || !playerId) return;
    await supabase.from('game_players').update({ ready: true }).eq('id', playerId);
    const { data } = await supabase.from('game_players').select('*').eq('room_id', room.id).order('seat');
    const all = (data || []) as GamePlayer[];
    if (all.length >= 2 && all.every(p => p.ready)) {
      await updateRoom({ game_status: 'playing', current_turn: all[0].id });
    }
  };

  const endTurn = async () => {
    if (!room) return;
    await updateRoom({ current_turn: nextAliveAfter(players, playerId) });
  };

  const attackCell = async (targetId: string, x: number, y: number) => {
    if (!room?.id || !playerId) return null;

    const { data: hitCell } = await supabase
      .from('game_cells')
      .update({ is_hit: true })
      .eq('room_id', room.id).eq('player', targetId).eq('cell_x', x).eq('cell_y', y)
      .select().maybeSingle();

    const coins = hitCell?.coins || 0;
    const hit = coins > 0;

    await supabase.from('game_attacks').insert({
      room_id: room.id, attacker_id: playerId, target_id: targetId, cell_x: x, cell_y: y, hit, coins,
    });

    const { data: fresh } = await supabase.from('game_players').select('*').eq('room_id', room.id).order('seat');
    let all = (fresh || []) as GamePlayer[];
    const me = all.find(p => p.id === playerId)!;
    if (hit) {
      await supabase.from('game_players').update({ coins_collected: me.coins_collected + coins }).eq('id', playerId);
      me.coins_collected += coins;
    }

    const { data: remaining } = await supabase
      .from('game_cells').select('coins').eq('room_id', room.id).eq('player', targetId).eq('is_hit', false);
    const targetLeft = (remaining || []).reduce((s, c) => s + c.coins, 0);

    if (targetLeft === 0) {
      await supabase.from('game_players').update({ eliminated: true }).eq('id', targetId);
      all = all.map(p => (p.id === targetId ? { ...p, eliminated: true } : p));

      if (room.win_mode === 'most_coins') {
        const best = [...all].sort((a, b) => b.coins_collected - a.coins_collected)[0];
        await updateRoom({ game_status: 'finished', winner: best.id });
        return { hit, coins };
      }
      const alive = all.filter(p => !p.eliminated);
      if (alive.length <= 1) {
        await updateRoom({ game_status: 'finished', winner: alive[0]?.id ?? playerId });
        return { hit, coins };
      }
    }

    await updateRoom({ current_turn: nextAliveAfter(all, playerId) });
    return { hit, coins };
  };

  return { room, players, myCells, attacks, updateRoom, placeMoney, setReady, endTurn, attackCell };
};
