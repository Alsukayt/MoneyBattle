import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Logo from './Logo';
import GameGrid from './GameGrid';
import { PlacementCell, coordLabel } from '@/types/game';
import { Coins, Check, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';


interface PlacementPhaseProps {
  gridSize: number;
  totalCoins: number;
  nickname: string;
  opponentNickname: string;
  isOpponentReady: boolean;
  onPlaceMoney: (cells: PlacementCell[]) => void;
  onReady: () => void;
  isReady: boolean;
}

const PlacementPhase = ({
  gridSize,
  totalCoins,
  nickname,
  opponentNickname,
  isOpponentReady,
  onPlaceMoney,
  onReady,
  isReady
}: PlacementPhaseProps) => {
  const { t } = useI18n();
  const [placements, setPlacements] = useState<PlacementCell[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [coinInput, setCoinInput] = useState('');

  const placedCoins = useMemo(() => 
    placements.reduce((sum, p) => sum + p.coins, 0), 
    [placements]
  );

  const remainingCoins = totalCoins - placedCoins;

  const handleCellClick = (x: number, y: number) => {
    if (isReady) return;
    setSelectedCell({ x, y });
    const existing = placements.find(p => p.x === x && p.y === y);
    setCoinInput(existing ? existing.coins.toString() : '');
  };

  const handlePlaceCoins = () => {
    if (!selectedCell || !coinInput) return;
    
    const coins = parseInt(coinInput);
    if (isNaN(coins) || coins <= 0) return;

    const existingIndex = placements.findIndex(
      p => p.x === selectedCell.x && p.y === selectedCell.y
    );
    
    const currentPlaced = existingIndex >= 0 
      ? placedCoins - placements[existingIndex].coins 
      : placedCoins;
    
    if (coins > totalCoins - currentPlaced) return;

    const newPlacements = [...placements];
    if (existingIndex >= 0) {
      newPlacements[existingIndex] = { ...selectedCell, coins };
    } else {
      newPlacements.push({ ...selectedCell, coins });
    }

    setPlacements(newPlacements);
    setSelectedCell(null);
    setCoinInput('');
  };

  const handleRemoveCoins = () => {
    if (!selectedCell) return;
    setPlacements(placements.filter(
      p => !(p.x === selectedCell.x && p.y === selectedCell.y)
    ));
    setSelectedCell(null);
    setCoinInput('');
  };

  const handleReady = () => {
    if (remainingCoins !== 0) return;
    onPlaceMoney(placements);
    onReady();
  };

  const gridCells = placements.map(p => ({
    x: p.x,
    y: p.y,
    coins: p.coins
  }));

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex justify-center pt-4">
          <Logo />
        </div>

        {/* Status Bar */}
        <Card className="card-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('coinsToPlace')}</p>
              <p className="text-2xl font-bold text-primary">
                <Coins className="w-5 h-5 inline me-1" />
                {remainingCoins} / {totalCoins}
              </p>
            </div>
            <div className="text-end">
              <p className="text-sm text-muted-foreground">{opponentNickname}</p>
              <p className={`text-sm font-medium ${isOpponentReady ? 'text-accent' : 'text-muted-foreground'}`}>
                {isOpponentReady ? t('ready') : t('placing')}
              </p>
            </div>
          </div>
        </Card>

        {/* Instructions */}
        {!isReady && (
          <Card className="card-glow text-center">
            <p className="text-foreground">
              {selectedCell 
                ? t('cellSelected', { c: coordLabel(selectedCell.x, selectedCell.y) })
                : t('clickCells')
              }
            </p>
          </Card>
        )}

        {/* Game Grid */}
        <div className="flex justify-center">
          <GameGrid
            size={gridSize}
            cells={gridCells}
            onCellClick={handleCellClick}
            showMoney={true}
            disabled={isReady}
          />
        </div>

        {/* Coin Input */}
        {selectedCell && !isReady && (
          <Card className="card-glow">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground">
                  {t('coinsForCell', { c: coordLabel(selectedCell.x, selectedCell.y) })}
                </label>
                <Input
                  type="number"
                  value={coinInput}
                  onChange={(e) => setCoinInput(e.target.value)}
                  placeholder={t('max', { n: remainingCoins + (placements.find(p => p.x === selectedCell.x && p.y === selectedCell.y)?.coins || 0) })}
                  className="mt-1 bg-background"
                  min={1}
                  max={remainingCoins + (placements.find(p => p.x === selectedCell.x && p.y === selectedCell.y)?.coins || 0)}
                />
              </div>
              <Button onClick={handlePlaceCoins} className="btn-gold">
                {t('place')}
              </Button>
              {placements.find(p => p.x === selectedCell.x && p.y === selectedCell.y) && (
                <Button onClick={handleRemoveCoins} variant="destructive" size="icon">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Ready Button */}
        {!isReady && (
          <Button 
            className="btn-gold w-full text-lg py-6"
            onClick={handleReady}
            disabled={remainingCoins !== 0}
          >
            <Check className="w-5 h-5 me-2" />
            {remainingCoins === 0 ? t('imReady') : t('placeRemaining', { n: remainingCoins })}
          </Button>
        )}

        {isReady && (
          <Card className="card-glow text-center">
            <div className="flex items-center justify-center gap-2 text-accent">
              <Check className="w-5 h-5" />
              {t('youReady', { name: opponentNickname })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PlacementPhase;
