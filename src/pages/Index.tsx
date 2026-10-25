import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGameRoom } from '@/hooks/useGameRoom';
import { PlacementCell, WinMode } from '@/types/game';
import HomeScreen from '@/components/game/HomeScreen';
import GameSetup from '@/components/game/GameSetup';
import PlacementPhase from '@/components/game/PlacementPhase';
import BattlePhase from '@/components/game/BattlePhase';
import GameOver from '@/components/game/GameOver';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';


const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

const Index = () => {
  const { t } = useI18n();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');

  const { room, players, myCells, attacks, updateRoom, placeMoney, setReady, endTurn, attackCell } =
    useGameRoom(roomCode, playerId);

  const me = players.find(p => p.id === playerId);

  const handleCreateGame = async (playerNickname: string) => {
    const code = generateRoomCode();
    setNickname(playerNickname);
    const { data: newRoom, error } = await supabase
      .from('game_rooms')
      .insert({ room_code: code, host_nickname: playerNickname, game_status: 'waiting' })
      .select().single();
    if (error || !newRoom) { toast.error(t('tCreateFail')); return; }
    const { data: p, error: pErr } = await supabase
      .from('game_players')
      .insert({ room_id: newRoom.id, nickname: playerNickname, seat: 0, is_host: true })
      .select().single();
    if (pErr || !p) { toast.error(t('tCreateFail')); return; }
    setPlayerId(p.id);
    setRoomCode(code);
  };

  const handleJoinGame = async (playerNickname: string, code: string) => {
    setNickname(playerNickname);
    const { data: existingRoom } = await supabase.from('game_rooms').select('*').eq('room_code', code).single();
    if (!existingRoom) { toast.error(t('tNotFound')); return; }
    if (existingRoom.game_status !== 'waiting') { toast.error(t('tStarted')); return; }
    const { data: list } = await supabase.from('game_players').select('seat').eq('room_id', existingRoom.id);
    const seat = (list || []).reduce((m, r) => Math.max(m, r.seat), -1) + 1;
    const { data: p, error } = await supabase
      .from('game_players')
      .insert({ room_id: existingRoom.id, nickname: playerNickname, seat })
      .select().single();
    if (error || !p) { toast.error(t('tJoinFail')); return; }
    setPlayerId(p.id);
    setRoomCode(code);
  };

  const handleStartGame = async (gridSize: number, coinAmount: number, winMode: WinMode) => {
    await updateRoom({ grid_size: gridSize, coin_amount: coinAmount, win_mode: winMode, game_status: 'placing' });
  };

  const handleAttack = async (targetId: string, x: number, y: number) => {
    const result = await attackCell(targetId, x, y);
    if (!result) return;
    if (result.hit) toast.success(t('tHit', { n: result.coins }));
    else toast(t('tMiss'));
  };

  const handleEndTurn = async () => {
    await endTurn();
    toast(t('tTurnEnded'));
  };

  const handlePlayAgain = () => {
    setRoomCode(null);
    setPlayerId(null);
    setNickname('');
  };

  // Notify when eliminated
  useEffect(() => {
    if (me?.eliminated && room?.game_status === 'playing') toast.error(t('tEliminated'));
  }, [me?.eliminated]);

  if (!roomCode) {
    return <HomeScreen onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} />;
  }

  if (!room || !me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-xl">{t('loading')}</div>
      </div>
    );
  }

  const others = players.filter(p => p.id !== playerId);

  if (room.game_status === 'waiting') {
    return (
      <GameSetup
        roomCode={room.room_code}
        isHost={me.is_host}
        players={players}
        onStartGame={handleStartGame}
      />
    );
  }

  if (room.game_status === 'placing') {
    const othersReady = others.length > 0 && others.every(p => p.ready);
    return (
      <PlacementPhase
        gridSize={room.grid_size}
        totalCoins={room.coin_amount}
        nickname={nickname}
        opponentNickname={others.length === 1 ? others[0].nickname : t('otherPlayers')}
        isOpponentReady={othersReady}
        onPlaceMoney={(cells: PlacementCell[]) => placeMoney(cells)}
        onReady={setReady}
        isReady={me.ready}
      />
    );
  }

  if (room.game_status === 'playing') {
    const current = players.find(p => p.id === room.current_turn);
    return (
      <BattlePhase
        gridSize={room.grid_size}
        totalCoins={room.coin_amount}
        winMode={room.win_mode}
        me={me}
        players={players}
        currentTurnName={current?.nickname || '...'}
        isMyTurn={room.current_turn === playerId && !me.eliminated}
        myCells={myCells}
        attacks={attacks}
        onAttack={handleAttack}
        onEndTurn={handleEndTurn}
      />
    );
  }

  const winner = players.find(p => p.id === room.winner);
  return (
    <GameOver
      isWinner={room.winner === playerId}
      winnerName={winner?.nickname || 'Winner'}
      winMode={room.win_mode}
      players={players}
      onPlayAgain={handlePlayAgain}
      onGoHome={handlePlayAgain}
    />
  );
};

export default Index;
