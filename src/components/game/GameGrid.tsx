import { cn } from '@/lib/utils';
import { Coins, X, CircleDot } from 'lucide-react';
import { colLabel } from '@/types/game';

interface GameGridProps {
  size: number;
  cells: { x: number; y: number; coins: number; isHit?: boolean }[];
  onCellClick?: (x: number, y: number) => void;
  showMoney?: boolean;
  disabled?: boolean;
  attackedCells?: { x: number; y: number; hit: boolean }[];
  highlight?: { x: number; y: number } | null;
}

const GameGrid = ({
  size, cells, onCellClick, showMoney = false, disabled = false, attackedCells = [], highlight = null,
}: GameGridProps) => {
  const getCellData = (x: number, y: number) => cells.find(c => c.x === x && c.y === y);
  const getAttackData = (x: number, y: number) => attackedCells.find(c => c.x === x && c.y === y);

  return (
    <div
      dir="ltr"
      className="grid gap-1.5 p-4 bg-card/50 rounded-xl border border-border"
      style={{
        gridTemplateColumns: `1.5rem repeat(${size}, minmax(0, 1fr))`,
        maxWidth: size <= 5 ? '420px' : size <= 8 ? '520px' : '620px',
      }}
    >
      <div />
      {Array.from({ length: size }).map((_, x) => (
        <div key={`c${x}`} className="text-center text-[10px] text-muted-foreground font-bold">{colLabel(x)}</div>
      ))}
      {Array.from({ length: size }).map((_, y) => (
        <div key={`r${y}`} className="contents">
          <div className="flex items-center justify-center text-[10px] text-muted-foreground font-bold">{y + 1}</div>
          {Array.from({ length: size }).map((_, x) => {
            const cellData = getCellData(x, y);
            const attackData = getAttackData(x, y);
            const hasMoney = cellData && cellData.coins > 0;
            const isHit = cellData?.isHit || attackData?.hit;
            const isMiss = attackData && !attackData.hit;
            const isHl = highlight && highlight.x === x && highlight.y === y;
            return (
              <button
                key={`${x}-${y}`}
                onClick={() => !disabled && onCellClick?.(x, y)}
                disabled={disabled || attackData !== undefined}
                className={cn(
                  'game-cell flex items-center justify-center text-xs font-bold relative',
                  hasMoney && showMoney && 'game-cell-money',
                  isHit && 'game-cell-hit animate-hit',
                  isMiss && 'game-cell-miss animate-miss',
                  disabled && 'cursor-not-allowed opacity-70',
                  attackData !== undefined && 'cursor-not-allowed',
                  isHl && 'ring-4 ring-primary animate-pulse',
                )}
              >
                {showMoney && hasMoney && !isHit && (
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
                {isMiss && <CircleDot className="w-4 h-4 text-muted-foreground" />}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default GameGrid;
