import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGameRoom } from '@/hooks/useGameRoom';
import { PlacementCell, GameRoom, gamersOf, coordLabel } from '@/types/game';
import HomeScreen from '@/components/game/HomeScreen';
import GameSetup from '@/components/game/GameSetup';
import PlacementPhase from '@/components/game/PlacementPhase';
import BattlePhase from '@/components/game/BattlePhase';
import GameOver from '@/components/game/GameOver';
import HostControls from '@/components/game/HostControls';
import Logo from '@/components/game/Logo';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';

const SESSION_KEY = 'dapts_session';

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

const loadSession = (): { roomCode: string; playerId: string } | null => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
};

const Index = () => {
  const { t } = useI18n();
  const saved = loadSession();
  const [roomCode, setRoomCode] = useState<string | null>(saved?.roomCode ?? null);
  const [playerId, setPlayerId] = useState<string | null>(saved?.playerId ?? null);
  const urlCode = new URLSearchParams(window.location.search).get('room')?.toUpperCase() || '';

  const {
    room, players, myCells, allCells, attacks, updateRoom, placeMoney, setReady, endTurn, attackCell,
    approveShot, rejectShot, setPlayerStatus,
  } = useGameRoom(roomCode, playerId);

  const me = players.find(p => p.id === playerId);

  const enter = (code: string, id: string) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ roomCode: code, playerId: id }));
    setPlayerId(id);
    setRoomCode(code);
    if (window.location.search) window.history.replaceState(null, '', '/');
  };

  const leave = () => {
    localStorage.removeItem(SESSION_KEY);
    setRoomCode(null);
    setPlayerId(null);
  };

  const handleCreateGame = async (nickname: string) => {
    const code = generateRoomCode();
    const { data: newRoom, error } = await supabase
      .from('game_rooms')
      .insert({ room_code: code, host_nickname: nickname, game_status: 'waiting' })
      .select().single();
    if (error || !newRoom) { toast.error(t('tCreateFail')); return; }
    const { data: p, error: pErr } = await supabase
      .from('game_players')
      .insert({ room_id: newRoom.id, nickname, seat: 0, is_host: true })
      .select().single();
    if (pErr || !p) { toast.error(t('tCreateFail')); return; }
    enter(code, p.id);
  };

  const handleJoinGame = async (nickname: string, code: string) => {
    const { data: existingRoom } = await supabase.from('game_rooms').select('*').eq('room_code', code).maybeSingle();
    if (!existingRoom) { toast.error(t('tNotFound')); return; }
    if (existingRoom.game_status === 'finished') { toast.error(t('tStarted')); return; }
    const { data: list } = await supabase.from('game_players').select('seat').eq('room_id', existingRoom.id);
    const seat = (list || []).reduce((m, r) => Math.max(m, r.seat), -1) + 1;
    const status = existingRoom.game_status === 'waiting' ? 'active' : 'pending';
    const { data: p, error } = await supabase
      .from('game_players')
      .insert({ room_id: existingRoom.id, nickname, seat, status })
      .select().single();
    if (error || !p) { toast.error(t('tJoinFail')); return; }
    if (status === 'pending') toast(t('tRequestSent'));
    enter(code, p.id);
  };

  const handleStartGame = async (coinAmount: number) => {
    await updateRoom({ coin_amount: coinAmount, game_status: 'placing' });
  };

  const handleAttack = async (targetId: string, x: number, y: number) => {
    const result = await attackCell(targetId, x, y);
    if (!result || result.pending) return;
    const c = coordLabel(x, y);
    if (result.hit) toast.success(t('tHitAt', { c, n: result.coins }));
    else toast(t('tMissAt', { c }));
  };

  const handleApprove = async () => {
    const s = room?.pending_shot;
    const result = await approveShot();
    if (!result || !s) return;
    const c = coordLabel(s.x, s.y);
    if (result.hit) toast.success(t('tHitAt', { c, n: result.coins }));
    else toast(t('tMissAt', { c }));
  };

  const handleEndTurn = async () => { await endTurn(); toast(t('tTurnEnded')); };
  const onChange = (u: Partial<GameRoom>) => updateRoom(u as never);

  // Notify when eliminated
  useEffect(() => {
    if (me?.eliminated && room?.game_status === 'playing') toast.error(t('tEliminated'));
  }, [me?.eliminated]);

  // Kicked/rejected, or saved session no longer valid
  useEffect(() => {
    if (me?.status === 'kicked') { toast.error(t('tKicked')); leave(); }
  }, [me?.status]);

  // Tell players when the host changes settings mid-game
  const settingsSig = room ? [room.shots_per_turn, room.approve_shots, room.host_shoots, room.win_mode, room.host_sees_money].join('|') : '';
  const lastSig = useRef('');
  useEffect(() => {
    if (!room || room.game_status !== 'playing') { lastSig.current = settingsSig; return; }
    if (lastSig.current && lastSig.current !== settingsSig && !me?.is_host) toast(t('tSettingsChanged'));
    lastSig.current = settingsSig;
  }, [settingsSig]);

  // Saved session points to a missing room/player → go home
  useEffect(() => {
    if (!roomCode) return;
    const timer = setTimeout(() => { if (!room || (players.length > 0 && !me)) leave(); }, 6000);
    return () => clearTimeout(timer);
  }, [roomCode, room, players.length, me]);

  if (!roomCode) {
    return <HomeScreen onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} initialCode={urlCode} />;
  }

  if (!room || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-xl">{t('loading')}</div>
      </div>
    );
  }

  const hostControls = me.is_host && (
    <HostControls room={room} players={players} meId={me.id} onChange={onChange} onSetStatus={setPlayerStatus} />
  );

  if (me.status === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-background">
        <Logo />
        <Card className="card-glow text-center animate-pulse">{t('waitingApproval')}</Card>
      </div>
    );
  }

  if (room.game_status === 'waiting') {
    return (
      <GameSetup
        room={room}
        isHost={me.is_host}
        players={players}
        onChange={onChange}
        onKick={(id) => setPlayerStatus(id, 'kicked')}
        onStartGame={handleStartGame}
      />
    );
  }

  const gamers = gamersOf(room, players);
  const amGamer = gamers.some(p => p.id === me.id);
  const others = gamers.filter(p => p.id !== playerId);

  // Placement: during the placing phase, or a late-joiner who hasn't placed yet
  if (room.game_status !== 'finished' && amGamer && !me.ready) {
    const othersReady = others.length > 0 && others.every(p => p.ready);
    return (
      <>
        <PlacementPhase
          gridSize={room.grid_size}
          totalCoins={room.coin_amount}
          nickname={me.nickname}
          opponentNickname={others.length === 1 ? others[0].nickname : t('otherPlayers')}
          isOpponentReady={othersReady}
          onPlaceMoney={(cells: PlacementCell[]) => placeMoney(cells)}
          onReady={setReady}
          isReady={me.ready}
        />
        {hostControls && <div className="fixed bottom-4 inset-x-0 px-4 max-w-md mx-auto">{hostControls}</div>}
      </>
    );
  }

  if (room.game_status === 'placing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 bg-background">
        <Logo />
        <Card className="card-glow w-full max-w-md space-y-2">
          {!amGamer && <p className="text-center text-primary">{t('spectating')}</p>}
          {gamers.map(p => (
            <div key={p.id} className="flex justify-between">
              <span>{p.nickname}</span>
              <span className={p.ready ? 'text-accent' : 'text-muted-foreground'}>{p.ready ? t('ready') : t('placing')}</span>
            </div>
          ))}
        </Card>
        <div className="w-full max-w-md">{hostControls}</div>
      </div>
    );
  }

  if (room.game_status === 'playing') {
    return (
      <BattlePhase
        room={room}
        me={me}
        players={players}
        myCells={myCells}
        allCells={allCells}
        attacks={attacks}
        onAttack={handleAttack}
        onEndTurn={handleEndTurn}
        onApprove={handleApprove}
        onReject={rejectShot}
        onChange={onChange}
        onSetStatus={setPlayerStatus}
      />
    );
  }

  const winner = players.find(p => p.id === room.winner);
  return (
    <GameOver
      isWinner={room.winner === playerId}
      winnerName={winner?.nickname || 'Winner'}
      winMode={room.win_mode}
      players={gamers}
      onPlayAgain={leave}
      onGoHome={leave}
    />
  );
};

export default Index;
