import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import {
  GameRoom, GameCell, GamePlayer, GameAttack, gamersOf, nextTurnAfter, turnEndsAfterShot, needsApproval,
} from '@/types/game';

type RoomUpdate = Database['public']['Tables']['game_rooms']['Update'];

export const useGameRoom = (roomCode: string | null, playerId: string | null) => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [myCells, setMyCells] = useState<GameCell[]>([]);
  const [allCells, setAllCells] = useState<GameCell[]>([]);
  const [attacks, setAttacks] = useState<GameAttack[]>([]);

  const amHost = players.find(p => p.id === playerId)?.is_host ?? false;

  const fetchRoom = useCallback(async () => {
    if (!roomCode) return;
    const { data } = await supabase.from('game_rooms').select('*').eq('room_code', roomCode).maybeSingle();
    if (data) setRoom(data as unknown as GameRoom);
  }, [roomCode]);

  const fetchPlayers = useCallback(async () => {
    if (!room?.id) return;
    const { data } = await supabase.from('game_players').select('*').eq('room_id', room.id).order('seat');
    if (data) setPlayers(data as GamePlayer[]);
  }, [room?.id]);

  const fetchCells = useCallback(async () => {
    if (!room?.id || !playerId) return;
    const { data } = await supabase.from('game_cells').select('*').eq('room_id', room.id);
    const list = (data || []) as GameCell[];
    setMyCells(list.filter(c => c.player === playerId));
    setAllCells(amHost ? list : []);
  }, [room?.id, playerId, amHost]);

  const fetchAttacks = useCallback(async () => {
    if (!room?.id) return;
    const { data } = await supabase.from('game_attacks').select('*').eq('room_id', room.id);
    if (data) setAttacks(data as GameAttack[]);
  }, [room?.id]);

  useEffect(() => { setRoom(null); setPlayers([]); fetchRoom(); }, [fetchRoom]);
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

  const updateRoom = async (updates: RoomUpdate) => {
    if (!room?.id) return;
    setRoom(r => (r ? { ...r, ...(updates as unknown as Partial<GameRoom>) } : r));
    const { error } = await supabase.from('game_rooms').update(updates).eq('id', room.id);
    if (error) console.error('Error updating room:', error);
  };

  const freshPlayers = async () => {
    const { data } = await supabase.from('game_players').select('*').eq('room_id', room!.id).order('seat');
    return (data || []) as GamePlayer[];
  };

  const freshRoom = async () => {
    const { data } = await supabase.from('game_rooms').select('*').eq('id', room!.id).single();
    return data as unknown as GameRoom;
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
    const r = await freshRoom();
    if (r.game_status !== 'placing') return; // late joiner: game already running
    const all = await freshPlayers();
    const gamers = gamersOf(r, all);
    if (gamers.length >= 2 && gamers.every(p => p.ready)) {
      await updateRoom({ game_status: 'playing', current_turn: gamers[0].id, shots_used: 0, pending_shot: null });
    }
  };

  const endTurn = async () => {
    if (!room) return;
    const all = await freshPlayers();
    await updateRoom({ current_turn: nextTurnAfter(room, all, room.current_turn), shots_used: 0, pending_shot: null });
  };

  /** Actually performs a shot from attackerId on targetId. */
  const performAttack = async (attackerId: string, targetId: string, x: number, y: number) => {
    if (!room?.id) return null;
    const r = await freshRoom();

    const { data: hitCell } = await supabase
      .from('game_cells')
      .update({ is_hit: true })
      .eq('room_id', room.id).eq('player', targetId).eq('cell_x', x).eq('cell_y', y)
      .select().maybeSingle();

    const coins = hitCell?.coins || 0;
    const hit = coins > 0;

    await supabase.from('game_attacks').insert({
      room_id: room.id, attacker_id: attackerId, target_id: targetId, cell_x: x, cell_y: y, hit, coins,
    });

    let all = await freshPlayers();
    const attacker = all.find(p => p.id === attackerId);
    if (hit && attacker) {
      await supabase.from('game_players').update({ coins_collected: attacker.coins_collected + coins }).eq('id', attackerId);
      all = all.map(p => (p.id === attackerId ? { ...p, coins_collected: p.coins_collected + coins } : p));
    }

    const { data: remaining } = await supabase
      .from('game_cells').select('coins').eq('room_id', room.id).eq('player', targetId).eq('is_hit', false);
    const targetLeft = (remaining || []).reduce((s, c) => s + c.coins, 0);

    if (targetLeft === 0) {
      await supabase.from('game_players').update({ eliminated: true }).eq('id', targetId);
      all = all.map(p => (p.id === targetId ? { ...p, eliminated: true } : p));
      const gamers = gamersOf(r, all);
      if (r.win_mode === 'most_coins') {
        const best = [...gamers].sort((a, b) => b.coins_collected - a.coins_collected)[0];
        await updateRoom({ game_status: 'finished', winner: best?.id ?? attackerId, pending_shot: null });
        return { hit, coins };
      }
      const alive = gamers.filter(p => !p.eliminated);
      if (alive.length <= 1) {
        await updateRoom({ game_status: 'finished', winner: alive[0]?.id ?? attackerId, pending_shot: null });
        return { hit, coins };
      }
    }

    if (turnEndsAfterShot(r.shots_per_turn, r.shots_used)) {
      await updateRoom({ current_turn: nextTurnAfter(r, all, attackerId), shots_used: 0, pending_shot: null });
    } else {
      await updateRoom({ shots_used: r.shots_used + 1, pending_shot: null });
    }
    return { hit, coins };
  };

  /**
   * Shot request. If the host fires (on behalf of the current player) it happens right away.
   * Otherwise it waits for host approval when that option is on.
   */
  const attackCell = async (targetId: string, x: number, y: number): Promise<{ hit: boolean; coins: number; pending?: boolean } | null> => {
    if (!room || !playerId) return null;
    const shooter = room.host_shoots ? room.current_turn : playerId;
    if (!shooter) return null;
    if (!amHost && needsApproval(room)) {
      await updateRoom({ pending_shot: { attacker_id: shooter, target_id: targetId, x, y } as never });
      return { hit: false, coins: 0, pending: true };
    }
    return performAttack(shooter, targetId, x, y);
  };

  const approveShot = async () => {
    const s = room?.pending_shot;
    if (!s) return null;
    return performAttack(s.attacker_id, s.target_id, s.x, s.y);
  };

  const rejectShot = () => updateRoom({ pending_shot: null });

  const setPlayerStatus = async (id: string, status: 'active' | 'kicked') => {
    await supabase.from('game_players').update({ status }).eq('id', id);
    if (status === 'kicked' && room?.current_turn === id && room.game_status === 'playing') {
      const all = (await freshPlayers()).map(p => (p.id === id ? { ...p, status: 'kicked' as const } : p));
      await updateRoom({ current_turn: nextTurnAfter(room, all, id), shots_used: 0, pending_shot: null });
    }
    if (status === 'kicked' && room?.game_status === 'playing') {
      const all = (await freshPlayers()).map(p => (p.id === id ? { ...p, status: 'kicked' as const } : p));
      const alive = gamersOf(room, all).filter(p => !p.eliminated && p.ready);
      if (alive.length <= 1) await updateRoom({ game_status: 'finished', winner: alive[0]?.id ?? null, pending_shot: null });
    }
  };

  return {
    room, players, myCells, allCells, attacks, updateRoom, placeMoney, setReady, endTurn, attackCell,
    approveShot, rejectShot, setPlayerStatus,
  };
};
