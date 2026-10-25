import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGameRoom } from '@/hooks/useGameRoom';
import { PlayerRole, PlacementCell } from '@/types/game';
import HomeScreen from '@/components/game/HomeScreen';
import GameSetup from '@/components/game/GameSetup';
import PlacementPhase from '@/components/game/PlacementPhase';
import BattlePhase from '@/components/game/BattlePhase';
import GameOver from '@/components/game/GameOver';
import { toast } from 'sonner';

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const Index = () => {
  const [gameState, setGameState] = useState<'home' | 'setup' | 'placing' | 'playing' | 'finished'>('home');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerRole, setPlayerRole] = useState<PlayerRole | null>(null);
  const [nickname, setNickname] = useState('');
  const [myAttacks, setMyAttacks] = useState<{ x: number; y: number; hit: boolean; coins: number }[]>([]);

  const { room, myCells, opponentCells, updateRoom, placeMoney, attackCell } = useGameRoom(roomCode, playerRole);

  // Sync game state with room status
  useEffect(() => {
    if (!room) return;

    if (room.game_status === 'waiting' && gameState !== 'setup') {
      setGameState('setup');
    } else if (room.game_status === 'placing' && gameState !== 'placing') {
      setGameState('placing');
    } else if (room.game_status === 'playing' && gameState !== 'playing') {
      setGameState('playing');
    } else if (room.game_status === 'finished' && gameState !== 'finished') {
      setGameState('finished');
    }
  }, [room?.game_status]);

  // Track opponent attacks on my cells
  useEffect(() => {
    if (!room || room.game_status !== 'playing') return;
    
    const hitCells = myCells.filter(c => c.is_hit);
    if (hitCells.length > 0) {
      const lastHit = hitCells[hitCells.length - 1];
      // Show notification when opponent hits our coins
    }
  }, [myCells, room?.game_status]);

  const handleCreateGame = async (playerNickname: string) => {
    const code = generateRoomCode();
    setNickname(playerNickname);

    const { error } = await supabase
      .from('game_rooms')
      .insert({
        room_code: code,
        host_nickname: playerNickname,
        game_status: 'waiting'
      });

    if (error) {
      toast.error('Failed to create game. Try again!');
      console.error(error);
      return;
    }

    setRoomCode(code);
    setPlayerRole('host');
    setGameState('setup');
  };

  const handleJoinGame = async (playerNickname: string, code: string) => {
    setNickname(playerNickname);

    // Check if room exists
    const { data: existingRoom, error: fetchError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', code)
      .single();

    if (fetchError || !existingRoom) {
      toast.error('Room not found! Check the code and try again.');
      return;
    }

    if (existingRoom.guest_nickname) {
      toast.error('Room is full!');
      return;
    }

    // Join the room
    const { error: updateError } = await supabase
      .from('game_rooms')
      .update({ guest_nickname: playerNickname })
      .eq('room_code', code);

    if (updateError) {
      toast.error('Failed to join game. Try again!');
      return;
    }

    setRoomCode(code);
    setPlayerRole('guest');
    setGameState('setup');
  };

  const handleStartGame = async (gridSize: number, coinAmount: number) => {
    await updateRoom({
      grid_size: gridSize,
      coin_amount: coinAmount,
      game_status: 'placing'
    });
  };

  const handlePlaceMoney = async (cells: PlacementCell[]) => {
    await placeMoney(cells);
  };

  const handleReady = async () => {
    if (!playerRole || !room) return;

    const updates: Record<string, boolean | string> = {};
    
    if (playerRole === 'host') {
      updates.host_ready = true;
    } else {
      updates.guest_ready = true;
    }

    // Check if both players will be ready
    const bothReady = playerRole === 'host' 
      ? room.guest_ready 
      : room.host_ready;

    if (bothReady) {
      updates.game_status = 'playing';
      updates.current_turn = 'host'; // Host goes first
    }

    await updateRoom(updates);
  };

  const handleAttack = async (x: number, y: number) => {
    const result = await attackCell(x, y);
    
    const hit = result !== null && result.coins > 0;
    const coins = result?.coins || 0;

    setMyAttacks(prev => [...prev, { x, y, hit, coins }]);

    if (hit) {
      toast.success(`Hit! Found ${coins} coins!`);
    } else {
      toast('Miss! No coins there.');
    }
  };

  const handlePlayAgain = () => {
    setGameState('home');
    setRoomCode(null);
    setPlayerRole(null);
    setNickname('');
    setMyAttacks([]);
  };

  if (gameState === 'home') {
    return (
      <HomeScreen 
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
      />
    );
  }

  if (gameState === 'setup' && room) {
    return (
      <GameSetup
        roomCode={room.room_code}
        isHost={playerRole === 'host'}
        hostNickname={room.host_nickname}
        guestNickname={room.guest_nickname}
        onStartGame={handleStartGame}
      />
    );
  }

  if (gameState === 'placing' && room) {
    const isReady = playerRole === 'host' ? room.host_ready : room.guest_ready;
    const isOpponentReady = playerRole === 'host' ? room.guest_ready : room.host_ready;
    const opponentNickname = playerRole === 'host' ? room.guest_nickname : room.host_nickname;

    return (
      <PlacementPhase
        gridSize={room.grid_size}
        totalCoins={room.coin_amount}
        nickname={nickname}
        opponentNickname={opponentNickname || 'Opponent'}
        isOpponentReady={isOpponentReady}
        onPlaceMoney={handlePlaceMoney}
        onReady={handleReady}
        isReady={isReady}
      />
    );
  }

  if (gameState === 'playing' && room) {
    const opponentNickname = playerRole === 'host' ? room.guest_nickname : room.host_nickname;
    const isMyTurn = room.current_turn === playerRole;

    return (
      <BattlePhase
        gridSize={room.grid_size}
        totalCoins={room.coin_amount}
        nickname={nickname}
        opponentNickname={opponentNickname || 'Opponent'}
        isMyTurn={isMyTurn}
        myCells={myCells}
        opponentCells={opponentCells}
        myAttacks={myAttacks}
        onAttack={handleAttack}
        onEndTurn={async () => {
          await updateRoom({ current_turn: playerRole === 'host' ? 'guest' : 'host' });
          toast('Turn ended.');
        }}
      />
    );
  }

  if (gameState === 'finished' && room) {
    const isWinner = room.winner === playerRole;
    const winnerName = room.winner === 'host' ? room.host_nickname : room.guest_nickname;
    const loserName = room.winner === 'host' ? room.guest_nickname : room.host_nickname;

    return (
      <GameOver
        isWinner={isWinner}
        winnerName={winnerName || 'Winner'}
        loserName={loserName || 'Loser'}
        onPlayAgain={handlePlayAgain}
        onGoHome={handlePlayAgain}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    </div>
  );
};

export default Index;
