import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, UserX, UserCheck, Lock } from 'lucide-react';
import { GamePlayer, GameRoom } from '@/types/game';
import RoomOptions from './RoomOptions';
import { useI18n } from '@/i18n';

interface Props {
  room: GameRoom;
  players: GamePlayer[];
  meId: string;
  onChange: (u: Partial<GameRoom>) => void;
  onSetStatus: (id: string, s: 'active' | 'kicked') => void;
}

/** Host-only: join requests, remove players, and mid-game settings. */
const HostControls = ({ room, players, meId, onChange, onSetStatus }: Props) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const pending = players.filter(p => p.status === 'pending');
  const active = players.filter(p => p.status === 'active' && p.id !== meId);

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <Card className="card-glow border-primary">
          <h3 className="font-bold mb-2 text-sm">{t('joinRequests')}</h3>
          {pending.map(p => (
            <div key={p.id} className="flex items-center justify-between gap-2 py-1">
              <span className="truncate">{p.nickname}</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onSetStatus(p.id, 'active')}><UserCheck className="w-4 h-4 me-1" />{t('accept')}</Button>
                <Button size="sm" variant="outline" onClick={() => onSetStatus(p.id, 'kicked')}>{t('reject')}</Button>
              </div>
            </div>
          ))}
        </Card>
      )}
      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Settings className="w-4 h-4 me-1" /> {t('inGameSettings')}
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('inGameSettings')}</DialogTitle></DialogHeader>
          <RoomOptions room={room} onChange={onChange} />
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" />{t('lockedSettings')}</p>
          <div className="space-y-1">
            <h4 className="font-bold text-sm">{t('players')}</h4>
            {active.map(p => (
              <div key={p.id} className="flex items-center justify-between py-1">
                <span className="truncate">{p.nickname}</span>
                <Button size="sm" variant="destructive" onClick={() => onSetStatus(p.id, 'kicked')}>
                  <UserX className="w-4 h-4 me-1" />{t('kick')}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostControls;
