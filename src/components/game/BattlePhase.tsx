import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import Logo from './Logo';
import GameGrid from './GameGrid';
import { GameCell } from '@/types/game';
import { Coins, Target, Shield, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BattlePhaseProps {
  gridSize: number;
  totalCoins: number;
  nickname: string;
  opponentNickname: string;
  isMyTurn: boolean;
  myCells: GameCell[];
  opponentCells: GameCell[];
  myAttacks: { x: number; y: number; hit: boolean; coins: number }[];
  onAttack: (x: number, y: number) => void;
  onEndTurn?: () => void;
}

const BattlePhase = ({
  gridSize,
  totalCoins,
  nickname,
  opponentNickname,
  isMyTurn,
  myCells,
  opponentCells,
  myAttacks,
  onAttack,
  onEndTurn
}: BattlePhaseProps) => {
  const [lastHit, setLastHit] = useState<{ coins: number } | null>(null);

  const myRemainingCoins = useMemo(() => 
    myCells.filter(c => !c.is_hit).reduce((sum, c) => sum + c.coins, 0),
    [myCells]
  );

  const opponentRemainingCoins = useMemo(() => {
    const hitCoins = myAttacks.filter(a => a.hit).reduce((sum, a) => sum + a.coins, 0);
    return totalCoins - hitCoins;
  }, [myAttacks, totalCoins]);

  const handleCellClick = (x: number, y: number) => {
    if (!isMyTurn) return;
    const alreadyAttacked = myAttacks.some(a => a.x === x && a.y === y);
    if (alreadyAttacked) return;
    onAttack(x, y);
  };

  const myGridCells = myCells.map(c => ({
    x: c.cell_x,
    y: c.cell_y,
    coins: c.coins,
    isHit: c.is_hit
  }));

  const attackedCells = myAttacks.map(a => ({
    x: a.x,
    y: a.y,
    hit: a.hit
  }));

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="w-full max-w-4xl space-y-4">
        <div className="flex justify-center pt-4">
          <Logo />
        </div>

        {/* Turn Indicator */}
        <Card className={`card-glow text-center ${isMyTurn ? 'border-primary' : 'border-muted'}`}>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {isMyTurn ? (
              <>
                <Target className="w-6 h-6 text-primary animate-pulse" />
                <span className="text-xl font-bold text-primary">Your Turn - Attack!</span>
                {onEndTurn && (
                  <Button variant="outline" size="sm" onClick={onEndTurn} className="ml-4">
                    <SkipForward className="w-4 h-4 mr-1" />
                    End Turn
                  </Button>
                )}
              </>
            ) : (
              <>
                <Shield className="w-6 h-6 text-muted-foreground" />
                <span className="text-xl font-bold text-muted-foreground">
                  {opponentNickname}'s Turn...
                </span>
              </>
            )}
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="card-glow">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{opponentNickname}'s Remaining</p>
              <p className="text-2xl font-bold text-destructive">
                <Coins className="w-5 h-5 inline mr-1" />
                {opponentRemainingCoins}
              </p>
            </div>
          </Card>
          <Card className="card-glow">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Your Remaining</p>
              <p className="text-2xl font-bold text-accent">
                <Coins className="w-5 h-5 inline mr-1" />
                {myRemainingCoins}
              </p>
            </div>
          </Card>
        </div>

        {/* Grids */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Opponent's Grid (Attack) */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-center flex items-center justify-center gap-2">
              <Target className="w-5 h-5 text-destructive" />
              {opponentNickname}'s Grid
            </h3>
            <div className="flex justify-center">
              <GameGrid
                size={gridSize}
                cells={[]}
                onCellClick={handleCellClick}
                showMoney={false}
                disabled={!isMyTurn}
                attackedCells={attackedCells}
              />
            </div>
          </div>

          {/* My Grid (Defense) */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-center flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              Your Grid
            </h3>
            <div className="flex justify-center">
              <GameGrid
                size={gridSize}
                cells={myGridCells}
                showMoney={true}
                disabled={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattlePhase;
