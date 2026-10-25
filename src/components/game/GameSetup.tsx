import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Logo from './Logo';
import { Copy, Check, Settings, Play } from 'lucide-react';
import { GamePlayer, WinMode } from '@/types/game';
import { useI18n } from '@/i18n';


interface GameSetupProps {
  roomCode: string;
  isHost: boolean;
  players: GamePlayer[];
  onStartGame: (gridSize: number, coinAmount: number, winMode: WinMode) => void;
}

const GRID_SIZES = [
  { value: 5, label: '5x5', description: 'quick' as const },
  { value: 8, label: '8x8', description: 'balanced' as const },
  { value: 10, label: '10x10', description: 'epic' as const },
];

const WIN_MODES: { value: WinMode; label: 'lastStanding' | 'mostCoins'; description: 'lastStandingDesc' | 'mostCoinsDesc' }[] = [
  { value: 'last_standing', label: 'lastStanding', description: 'lastStandingDesc' },
  { value: 'most_coins', label: 'mostCoins', description: 'mostCoinsDesc' },
];

const GameSetup = ({ roomCode, isHost, players, onStartGame }: GameSetupProps) => {
  const { t } = useI18n();
  const [gridSize, setGridSize] = useState(5);
  const [coinAmount, setCoinAmount] = useState(100);
  const [winMode, setWinMode] = useState<WinMode>('last_standing');
  const [copied, setCopied] = useState(false);
  const host = players.find(p => p.is_host);
  const canStart = players.length >= 2;

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center"><Logo /></div>

        <Card className="card-glow text-center">
          <p className="text-muted-foreground text-sm mb-2">{t('shareCode')}</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-mono font-black tracking-widest text-primary text-glow" dir="ltr">{roomCode}</span>
            <Button variant="outline" size="icon" onClick={copyRoomCode} className="shrink-0">
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </Card>

        <Card className="card-glow">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            {t('players')} ({players.length})
          </h3>
          <div className="space-y-3">
            {players.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span className="font-medium">{p.nickname}</span>
                {p.is_host && <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">{t('host')}</span>}
              </div>
            ))}
            <div className="p-3 text-muted-foreground italic text-sm">{t('waitingMore')}</div>
          </div>
        </Card>

        {isHost && (
          <Card className="card-glow">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" /> {t('settings')}
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">{t('gridSize')}</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {GRID_SIZES.map(size => (
                    <button key={size.value} onClick={() => setGridSize(size.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${gridSize === size.value ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}>
                      <div className="font-bold">{size.label}</div>
                      <div className="text-xs text-muted-foreground">{t(size.description)}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-foreground">{t('howToWin')}</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {WIN_MODES.map(m => (
                    <button key={m.value} onClick={() => setWinMode(m.value)}
                      className={`p-3 rounded-lg border-2 text-start transition-all ${winMode === m.value ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}>
                      <div className="font-bold text-sm">{t(m.label)}</div>
                      <div className="text-xs text-muted-foreground">{t(m.description)}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="coins" className="text-foreground">{t('coinsPerPlayer')}</Label>
                <Input id="coins" type="number" value={coinAmount}
                  onChange={(e) => setCoinAmount(Math.max(10, parseInt(e.target.value) || 10))}
                  min={10} max={1000} className="mt-1 bg-background border-border" />
              </div>
            </div>
          </Card>
        )}

        {isHost ? (
          <Button className="btn-gold w-full text-lg py-6" onClick={() => onStartGame(gridSize, coinAmount, winMode)} disabled={!canStart}>
            <Play className="w-5 h-5 me-2" />
            {canStart ? t('startGame', { n: players.length }) : t('waitingPlayers')}
          </Button>
        ) : (
          <Card className="card-glow text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t('waitingHost', { name: host?.nickname || t('host') })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GameSetup;
