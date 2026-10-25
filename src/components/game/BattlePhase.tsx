import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import GameGrid from './GameGrid';
import { GameCell, GamePlayer, GameAttack, WinMode } from '@/types/game';
import { Coins, Target, Shield, SkipForward, Skull } from 'lucide-react';

interface BattlePhaseProps {
  gridSize: number;
  totalCoins: number;
  winMode: WinMode;
  me: GamePlayer;
  players: GamePlayer[];
  currentTurnName: string;
  isMyTurn: boolean;
  myCells: GameCell[];
  attacks: GameAttack[];
  onAttack: (targetId: string, x: number, y: number) => void;
  onEndTurn: () => void;
}

const BattlePhase = ({
  gridSize, totalCoins, winMode, me, players, currentTurnName, isMyTurn, myCells, attacks, onAttack, onEndTurn,
}: BattlePhaseProps) => {
  const opponents = players.filter(p => p.id !== me.id);
  const aliveOpponents = opponents.filter(p => !p.eliminated);
  const [targetId, setTargetId] = useState<string | null>(aliveOpponents[0]?.id ?? null);

  useEffect(() => {
    if (!targetId || !aliveOpponents.some(p => p.id === targetId)) setTargetId(aliveOpponents[0]?.id ?? null);
  }, [aliveOpponents.map(p => p.id).join(','), targetId]);

  const myRemainingCoins = useMemo(
    () => myCells.filter(c => !c.is_hit).reduce((s, c) => s + c.coins, 0), [myCells]);

  const remainingFor = (pid: string) =>
    totalCoins - attacks.filter(a => a.target_id === pid && a.hit).reduce((s, a) => s + a.coins, 0);

  const target = opponents.find(p => p.id === targetId);
  const targetAttacks = attacks.filter(a => a.target_id === targetId);

  const handleCellClick = (x: number, y: number) => {
    if (!isMyTurn || !targetId) return;
    if (targetAttacks.some(a => a.cell_x === x && a.cell_y === y)) return;
    onAttack(targetId, x, y);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="w-full max-w-5xl space-y-4">
        <div className="flex justify-center pt-4"><Logo /></div>

        <Card className={`card-glow text-center ${isMyTurn ? 'border-primary' : 'border-muted'}`}>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {me.eliminated ? (
              <><Skull className="w-6 h-6 text-destructive" /><span className="text-xl font-bold text-destructive">You're out — watching {currentTurnName}'s turn</span></>
            ) : isMyTurn ? (
              <>
                <Target className="w-6 h-6 text-primary animate-pulse" />
                <span className="text-xl font-bold text-primary">Your Turn - Pick a target!</span>
                <Button variant="outline" size="sm" onClick={onEndTurn} className="ml-4">
                  <SkipForward className="w-4 h-4 mr-1" /> End Turn
                </Button>
              </>
            ) : (
              <><Shield className="w-6 h-6 text-muted-foreground" /><span className="text-xl font-bold text-muted-foreground">{currentTurnName}'s Turn...</span></>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {winMode === 'most_coins' ? 'Most coins collected wins' : 'Last one standing wins'}
          </p>
        </Card>

        {/* Players / target picker */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="card-glow text-center">
            <p className="text-sm text-muted-foreground">You</p>
            <p className="text-xl font-bold text-accent"><Coins className="w-4 h-4 inline mr-1" />{myRemainingCoins}</p>
            <p className="text-xs text-muted-foreground">Collected {me.coins_collected}</p>
          </Card>
          {opponents.map(p => (
            <button key={p.id} disabled={p.eliminated} onClick={() => setTargetId(p.id)} className="text-left">
              <Card className={`card-glow text-center transition-all ${p.id === targetId ? 'border-primary bg-primary/10' : ''} ${p.eliminated ? 'opacity-40' : 'hover:border-muted-foreground'}`}>
                <p className="text-sm text-muted-foreground truncate">{p.nickname}{p.eliminated && ' (out)'}</p>
                <p className="text-xl font-bold text-destructive"><Coins className="w-4 h-4 inline mr-1" />{remainingFor(p.id)}</p>
                <p className="text-xs text-muted-foreground">Collected {p.coins_collected}</p>
              </Card>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-center flex items-center justify-center gap-2">
              <Target className="w-5 h-5 text-destructive" />
              {target ? `${target.nickname}'s Grid` : 'No target'}
            </h3>
            <div className="flex justify-center">
              <GameGrid
                key={targetId || 'none'}
                size={gridSize}
                cells={[]}
                onCellClick={handleCellClick}
                showMoney={false}
                disabled={!isMyTurn || !targetId}
                attackedCells={targetAttacks.map(a => ({ x: a.cell_x, y: a.cell_y, hit: a.hit }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-center flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-accent" /> Your Grid
            </h3>
            <div className="flex justify-center">
              <GameGrid
                size={gridSize}
                cells={myCells.map(c => ({ x: c.cell_x, y: c.cell_y, coins: c.coins, isHit: c.is_hit }))}
                showMoney
                disabled
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattlePhase;
