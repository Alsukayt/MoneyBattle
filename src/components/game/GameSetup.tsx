import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Logo from './Logo';
import RoomOptions from './RoomOptions';
import { Copy, Check, Settings, Play, Link as LinkIcon, UserX } from 'lucide-react';
import { GamePlayer, GameRoom, gamersOf } from '@/types/game';
import { useI18n } from '@/i18n';
import { toast } from 'sonner';

interface GameSetupProps {
  room: GameRoom;
  isHost: boolean;
  players: GamePlayer[];
  onChange: (u: Partial<GameRoom>) => void;
  onKick: (id: string) => void;
  onStartGame: (coinAmount: number) => void;
}

const GRID_SIZES = [
  { value: 5, label: '5x5', description: 'quick' as const },
  { value: 8, label: '8x8', description: 'balanced' as const },
  { value: 10, label: '10x10', description: 'epic' as const },
];

const opt = (a: boolean) => `p-3 rounded-lg border-2 transition-all text-start ${a ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`;

const GameSetup = ({ room, isHost, players, onChange, onKick, onStartGame }: GameSetupProps) => {
  const { t } = useI18n();
  const [coinText, setCoinText] = useState('');
  const [coinErr, setCoinErr] = useState('');
  const [copied, setCopied] = useState(false);
  const active = players.filter(p => p.status === 'active');
  const host = players.find(p => p.is_host);
  const canStart = gamersOf(room, players).length >= 2;

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(room.room_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/?room=${room.room_code}`);
    toast.success(t('linkCopied'));
  };

  const start = () => {
    const n = parseInt(coinText, 10);
    if (!coinText.trim() || isNaN(n) || n < 10) { setCoinErr(t('errCoins')); return; }
    setCoinErr('');
    onStartGame(n);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center"><Logo /></div>

        <Card className="card-glow text-center space-y-3">
          <p className="text-muted-foreground text-sm">{t('shareCode')}</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-mono font-black tracking-widest text-primary text-glow" dir="ltr">{room.room_code}</span>
            <Button variant="outline" size="icon" onClick={copyRoomCode} className="shrink-0">
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={copyLink}><LinkIcon className="w-4 h-4 me-1" />{t('copyLink')}</Button>
        </Card>

        <Card className="card-glow">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            {t('players')} ({active.length})
          </h3>
          <div className="space-y-3">
            {active.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span className="font-medium">{p.nickname}</span>
                {p.is_host ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">{t('host')}</span>
                ) : isHost && (
                  <Button size="sm" variant="ghost" onClick={() => onKick(p.id)}><UserX className="w-4 h-4 me-1" />{t('kick')}</Button>
                )}
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
                <Label className="text-foreground">{t('hostRole')}</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={() => onChange({ host_plays: true })} className={opt(room.host_plays)}>
                    <div className="font-bold text-sm">{t('hostPlays')}</div>
                    <div className="text-xs text-muted-foreground">{t('hostPlaysDesc')}</div>
                  </button>
                  <button onClick={() => onChange({ host_plays: false })} className={opt(!room.host_plays)}>
                    <div className="font-bold text-sm">{t('hostOnly')}</div>
                    <div className="text-xs text-muted-foreground">{t('hostOnlyDesc')}</div>
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-foreground">{t('gridSize')}</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {GRID_SIZES.map(size => (
                    <button key={size.value} onClick={() => onChange({ grid_size: size.value })} className={opt(room.grid_size === size.value)}>
                      <div className="font-bold">{size.label}</div>
                      <div className="text-xs text-muted-foreground">{t(size.description)}</div>
                    </button>
                  ))}
                </div>
              </div>
              <RoomOptions room={room} onChange={onChange} />
              <div>
                <Label htmlFor="coins" className="text-foreground">{t('coinsPerPlayer')}</Label>
                <Input id="coins" type="text" inputMode="numeric" value={coinText} placeholder="100"
                  onChange={(e) => setCoinText(e.target.value.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[^0-9]/g, ''))}
                  className="mt-1 bg-background border-border" />
                {coinErr && <p className="text-xs text-destructive mt-1">{coinErr}</p>}
              </div>
            </div>
          </Card>
        )}

        {isHost ? (
          <Button className="btn-gold w-full text-lg py-6" onClick={start} disabled={!canStart}>
            <Play className="w-5 h-5 me-2" />
            {canStart ? t('startGame', { n: gamersOf(room, players).length }) : t('waitingPlayers')}
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
