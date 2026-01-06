import { cn } from '@/lib/utils';
import { Coins, X, CircleDot } from 'lucide-react';

interface GameGridProps {
  size: number;
  cells: { x: number; y: number; coins: number; isHit?: boolean }[];
  onCellClick?: (x: number, y: number) => void;
  showMoney?: boolean;
  disabled?: boolean;
  attackedCells?: { x: number; y: number; hit: boolean }[];
}

const GameGrid = ({ 
  size, 
  cells, 
  onCellClick, 
  showMoney = false, 
  disabled = false,
  attackedCells = []
}: GameGridProps) => {
  const getCellData = (x: number, y: number) => {
    return cells.find(c => c.x === x && c.y === y);
  };

  const getAttackData = (x: number, y: number) => {
    return attackedCells.find(c => c.x === x && c.y === y);
  };

  return (
    <div 
      className="grid gap-1.5 p-4 bg-card/50 rounded-xl border border-border"
      style={{ 
        gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        maxWidth: size <= 5 ? '400px' : size <= 8 ? '500px' : '600px'
      }}
    >
      {Array.from({ length: size * size }).map((_, index) => {
        const x = index % size;
        const y = Math.floor(index / size);
        const cellData = getCellData(x, y);
        const attackData = getAttackData(x, y);
        const hasMoney = cellData && cellData.coins > 0;
        const isHit = cellData?.isHit || attackData?.hit;
        const isMiss = attackData && !attackData.hit;

        return (
          <button
            key={`${x}-${y}`}
            onClick={() => !disabled && onCellClick?.(x, y)}
            disabled={disabled || (attackData !== undefined)}
            className={cn(
              'game-cell flex items-center justify-center text-xs font-bold relative',
              hasMoney && showMoney && 'game-cell-money',
              isHit && 'game-cell-hit animate-hit',
              isMiss && 'game-cell-miss animate-miss',
              disabled && 'cursor-not-allowed opacity-70',
              attackData !== undefined && 'cursor-not-allowed'
            )}
          >
            {showMoney && hasMoney && (
              <div className="flex flex-col items-center">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-primary text-[10px]">{cellData.coins}</span>
              </div>
            )}
            {isHit && (
              <div className="flex flex-col items-center text-destructive">
                <X className="w-5 h-5" />
                {cellData && <span className="text-[10px]">-{cellData.coins}</span>}
              </div>
            )}
            {isMiss && (
              <CircleDot className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default GameGrid;
