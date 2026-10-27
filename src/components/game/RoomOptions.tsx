import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { GameRoom, WinMode } from '@/types/game';
import { useI18n, TKey } from '@/i18n';

/** Settings the host can change both before and during the game. Writes straight to the room. */
interface Props {
  room: GameRoom;
  onChange: (u: Partial<GameRoom>) => void;
}

const opt = (active: boolean) =>
  `p-2 rounded-lg border-2 text-start transition-all ${active ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`;

const WIN_MODES: { value: WinMode; label: TKey; description: TKey }[] = [
  { value: 'last_standing', label: 'lastStanding', description: 'lastStandingDesc' },
  { value: 'most_coins', label: 'mostCoins', description: 'mostCoinsDesc' },
];

const RoomOptions = ({ room, onChange }: Props) => {
  const { t } = useI18n();
  const open = room.shots_per_turn === 0;
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-foreground">{t('howToWin')}</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {WIN_MODES.map(m => (
            <button key={m.value} onClick={() => onChange({ win_mode: m.value })} className={opt(room.win_mode === m.value)}>
              <div className="font-bold text-sm">{t(m.label)}</div>
              <div className="text-xs text-muted-foreground">{t(m.description)}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-foreground">{t('shotsPerTurn')}</Label>
        <div className="grid grid-cols-6 gap-1 mt-2">
          {[1, 2, 3, 4, 5, 0].map(n => (
            <button key={n} onClick={() => onChange({ shots_per_turn: n })} className={`${opt(room.shots_per_turn === n)} text-center text-xs`}>
              {n === 0 ? t('unlimited') : n}
            </button>
          ))}
        </div>
        {open && <p className="text-xs text-muted-foreground mt-1">{t('unlimitedNote')}</p>}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="text-foreground">{t('approveShots')}</Label>
          <p className="text-xs text-muted-foreground">{t('approveShotsDesc')}</p>
        </div>
        <Switch checked={room.approve_shots || open} disabled={open} onCheckedChange={v => onChange({ approve_shots: v })} />
      </div>

      <div>
        <Label className="text-foreground">{t('whoShoots')}</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button onClick={() => onChange({ host_shoots: false })} className={`${opt(!room.host_shoots)} text-sm`}>{t('playerShoots')}</button>
          <button onClick={() => onChange({ host_shoots: true })} className={`${opt(room.host_shoots)} text-sm`}>{t('hostShootsOpt')}</button>
        </div>
      </div>

      {!room.host_plays && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-foreground">{t('hostMoney')}</Label>
            <p className="text-xs text-muted-foreground">{t('hostMoneyDesc')}</p>
          </div>
          <Switch checked={room.host_sees_money} onCheckedChange={v => onChange({ host_sees_money: v })} />
        </div>
      )}
    </div>
  );
};

export default RoomOptions;
