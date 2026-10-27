import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import GameGrid from './GameGrid';
import HostControls from './HostControls';
import { GameCell, GamePlayer, GameAttack, GameRoom, gamersOf, coordLabel, needsApproval } from '@/types/game';
import { Coins, Target, Shield, SkipForward, Skull, Eye, Check, X } from 'lucide-react';
import { useI18n } from '@/i18n';

interface BattlePhaseProps {
  room: GameRoom;
  me: GamePlayer;
  players: GamePlayer[];
  myCells: GameCell[];
  allCells: GameCell[];
  attacks: GameAttack[];
  onAttack: (targetId: string, x: number, y: number) => void;
  onEndTurn: () => void;
  onApprove: () => void;
  onReject: () => void;
  onChange: (u: Partial<GameRoom>) => void;
  onSetStatus: (id: string, s: 'active' | 'kicked') => void;
}

const BattlePhase = ({
  room, me, players, myCells, allCells, attacks, onAttack, onEndTurn, onApprove, onReject, onChange, onSetStatus,
}: BattlePhaseProps) => {
  const { t } = useI18n();
  const gamers = gamersOf(room, players).filter(p => p.ready);
  const amGamer = gamers.some(p => p.id === me.id);
  const current = players.find(p => p.id === room.current_turn);
  const isMyTurn = room.current_turn === me.id && !me.eliminated;
  const pending = room.pending_shot;

  // Who the shots are fired "as": host fires for the current player, otherwise me.
  const shooterId = room.host_shoots || !amGamer ? room.current_turn : me.id;
  const canShoot = !pending && !!current && (
    (me.is_host && room.host_shoots) || (isMyTurn && !room.host_shoots)
  );
  const canEndTurn = (isMyTurn && !room.host_shoots) || (me.is_host && !!current);

  const targets = gamers.filter(p => p.id !== shooterId);
  const viewList = amGamer && !(me.is_host && room.host_shoots) ? gamers.filter(p => p.id !== me.id) : targets;
  const alive = viewList.filter(p => !p.eliminated);
  const [targetId, setTargetId] = useState<string | null>(alive[0]?.id ?? null);

  useEffect(() => {
    if (!targetId || !alive.some(p => p.id === targetId)) setTargetId(alive[0]?.id ?? null);
  }, [alive.map(p => p.id).join(','), targetId]);

  const myRemainingCoins = useMemo(() => myCells.filter(c => !c.is_hit).reduce((s, c) => s + c.coins, 0), [myCells]);
  const remainingFor = (pid: string) =>
    room.coin_amount - attacks.filter(a => a.target_id === pid && a.hit).reduce((s, a) => s + a.coins, 0);

  const target = players.find(p => p.id === targetId);
  const targetAttacks = attacks.filter(a => a.target_id === targetId);
  const hostSees = me.is_host && !room.host_plays && room.host_sees_money;
  const targetCells = hostSees
    ? allCells.filter(c => c.player === targetId).map(c => ({ x: c.cell_x, y: c.cell_y, coins: c.coins, isHit: c.is_hit }))
    : [];

  const handleCellClick = (x: number, y: number) => {
    if (!canShoot || !targetId || targetId === shooterId) return;
    if (targetAttacks.some(a => a.cell_x === x && a.cell_y === y)) return;
    onAttack(targetId, x, y);
  };

  const shotsLeft = room.shots_per_turn > 0 ? room.shots_per_turn - room.shots_used : null;
  const name = (id: string) => players.find(p => p.id === id)?.nickname ?? '?';

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="w-full max-w-5xl space-y-4">
        <div className="flex justify-center pt-4"><Logo /></div>

        {me.is_host && (
          <HostControls room={room} players={players} meId={me.id} onChange={onChange} onSetStatus={onSetStatus} />
        )}

        {pending && me.is_host && (
          <Card className="card-glow border-primary text-center space-y-2">
            <p className="font-bold">{t('pendingShot', { a: name(pending.attacker_id), c: coordLabel(pending.x, pending.y), t: name(pending.target_id) })}</p>
            <div className="flex justify-center gap-2">
              <Button onClick={onApprove}><Check className="w-4 h-4 me-1" />{t('approve')}</Button>
              <Button variant="outline" onClick={onReject}><X className="w-4 h-4 me-1" />{t('reject')}</Button>
            </div>
          </Card>
        )}

        <Card className={`card-glow text-center ${isMyTurn || canShoot ? 'border-primary' : 'border-muted'}`}>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {!amGamer ? (
              <><Eye className="w-6 h-6 text-primary" /><span className="text-lg font-bold">{t('spectating')} — {t('theirTurn', { name: current?.nickname ?? '...' })}</span></>
            ) : me.eliminated ? (
              <><Skull className="w-6 h-6 text-destructive" /><span className="text-xl font-bold text-destructive">{t('youOut', { name: current?.nickname ?? '...' })}</span></>
            ) : isMyTurn ? (
              <><Target className="w-6 h-6 text-primary animate-pulse" /><span className="text-xl font-bold text-primary">{room.host_shoots ? t('tellHost') : t('yourTurn')}</span></>
            ) : (
              <><Shield className="w-6 h-6 text-muted-foreground" /><span className="text-xl font-bold text-muted-foreground">{t('theirTurn', { name: current?.nickname ?? '...' })}</span></>
            )}
            {canEndTurn && (
              <Button variant="outline" size="sm" onClick={onEndTurn} className="ms-4">
                <SkipForward className="w-4 h-4 me-1" /> {t('endTurn')}
              </Button>
            )}
          </div>
          {me.is_host && room.host_shoots && current && (
            <p className="text-sm text-primary mt-2">{t('firingFor', { name: current.nickname })}</p>
          )}
          {pending && !me.is_host && pending.attacker_id === me.id && (
            <p className="text-sm text-primary mt-2 animate-pulse">{t('waitingShotApproval', { c: coordLabel(pending.x, pending.y) })}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {room.win_mode === 'most_coins' ? t('winMostCoins') : t('winLastStanding')}
            {shotsLeft !== null && ` · ${t('shotsLeft', { n: shotsLeft })}`}
            {needsApproval(room) && ` · ${t('approveShots')}`}
          </p>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {amGamer && (
            <Card className="card-glow text-center">
              <p className="text-sm text-muted-foreground">{t('you')}</p>
              <p className="text-xl font-bold text-accent"><Coins className="w-4 h-4 inline me-1" />{myRemainingCoins}</p>
              <p className="text-xs text-muted-foreground">{t('collected', { n: me.coins_collected })}</p>
            </Card>
          )}
          {viewList.map(p => (
            <button key={p.id} disabled={p.eliminated} onClick={() => setTargetId(p.id)} className="text-start">
              <Card className={`card-glow text-center transition-all ${p.id === targetId ? 'border-primary bg-primary/10' : ''} ${p.eliminated ? 'opacity-40' : 'hover:border-muted-foreground'} ${p.id === room.current_turn ? 'ring-2 ring-accent' : ''}`}>
                <p className="text-sm text-muted-foreground truncate">{p.nickname}{p.eliminated && t('out')}</p>
                <p className="text-xl font-bold text-destructive"><Coins className="w-4 h-4 inline me-1" />{remainingFor(p.id)}</p>
                <p className="text-xs text-muted-foreground">{t('collected', { n: p.coins_collected })}</p>
              </Card>
            </button>
          ))}
        </div>

        <div className={`grid gap-6 ${amGamer ? 'md:grid-cols-2' : ''}`}>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-center flex items-center justify-center gap-2">
              <Target className="w-5 h-5 text-destructive" />
              {target ? t('gridOf', { name: target.nickname }) : t('noTarget')}
            </h3>
            <div className="flex justify-center">
              <GameGrid
                key={targetId || 'none'}
                size={room.grid_size}
                cells={targetCells}
                onCellClick={handleCellClick}
                showMoney={hostSees}
                disabled={!canShoot || !targetId || targetId === shooterId}
                attackedCells={targetAttacks.map(a => ({ x: a.cell_x, y: a.cell_y, hit: a.hit }))}
                highlight={pending && pending.target_id === targetId ? { x: pending.x, y: pending.y } : null}
              />
            </div>
          </div>
          {amGamer && (
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-center flex items-center justify-center gap-2">
                <Shield className="w-5 h-5 text-accent" /> {t('yourGrid')}
              </h3>
              <div className="flex justify-center">
                <GameGrid
                  size={room.grid_size}
                  cells={myCells.map(c => ({ x: c.cell_x, y: c.cell_y, coins: c.coins, isHit: c.is_hit }))}
                  showMoney
                  disabled
                  highlight={pending && pending.target_id === me.id ? { x: pending.x, y: pending.y } : null}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattlePhase;
