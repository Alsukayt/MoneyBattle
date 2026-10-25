import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Logo from './Logo';
import { Plus, Users } from 'lucide-react';
import { useI18n } from '@/i18n';


interface HomeScreenProps {
  onCreateGame: (nickname: string) => void;
  onJoinGame: (nickname: string, roomCode: string) => void;
}

const HomeScreen = ({ onCreateGame, onJoinGame }: HomeScreenProps) => {
  const { t } = useI18n();
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!nickname.trim()) {
      setError(t('errNickname'));
      return;
    }
    onCreateGame(nickname.trim());
  };

  const handleJoin = () => {
    if (!nickname.trim()) {
      setError(t('errNickname'));
      return;
    }
    if (!roomCode.trim()) {
      setError(t('errCode'));
      return;
    }
    onJoinGame(nickname.trim(), roomCode.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Pixel grid pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '16px 16px'
      }} />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex justify-center">
          <Logo />
        </div>

        {mode === 'home' && (
          <Card className="card-glow space-y-4">
            <h2 className="text-base text-center text-foreground">{t('welcome')}</h2>
            <p className="text-muted-foreground text-center text-xs leading-relaxed">
              {t('intro')}
            </p>
            <div className="space-y-4 pt-4">
              <Button 
                className="btn-gold w-full"
                onClick={() => setMode('create')}
              >
                <Plus className="w-4 h-4 me-2" />
                {t('createGame')}
              </Button>
              <Button 
                className="btn-purple w-full"
                onClick={() => setMode('join')}
              >
                <Users className="w-4 h-4 me-2" />
                {t('joinGame')}
              </Button>
            </div>
          </Card>
        )}

        {mode === 'create' && (
          <Card className="card-glow space-y-4">
            <h2 className="text-base text-foreground">{t('createGame')}</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nickname" className="text-foreground text-xs">{t('nickname')}</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setError('');
                  }}
                  placeholder={t('enterName')}
                  className="mt-2 bg-background border-4 border-border uppercase"
                  maxLength={20}
                />
              </div>
              {error && <p className="text-destructive text-xs">{error}</p>}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-4 border-border"
                  onClick={() => setMode('home')}
                >
                  {t('back')}
                </Button>
                <Button 
                  className="btn-gold flex-1"
                  onClick={handleCreate}
                >
                  {t('create')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {mode === 'join' && (
          <Card className="card-glow space-y-4">
            <h2 className="text-base text-foreground">{t('joinGame')}</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="join-nickname" className="text-foreground text-xs">{t('nickname')}</Label>
                <Input
                  id="join-nickname"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setError('');
                  }}
                  placeholder={t('enterName')}
                  className="mt-2 bg-background border-4 border-border uppercase"
                  maxLength={20}
                />
              </div>
              <div>
                <Label htmlFor="room-code" className="text-foreground text-xs">{t('roomCode')}</Label>
                <Input
                  id="room-code"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="ABCD12"
                  className="mt-2 bg-background border-4 border-border uppercase tracking-widest text-center" dir="ltr"
                  maxLength={6}
                />
              </div>
              {error && <p className="text-destructive text-xs">{error}</p>}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-4 border-border"
                  onClick={() => setMode('home')}
                >
                  {t('back')}
                </Button>
                <Button 
                  className="btn-purple flex-1"
                  onClick={handleJoin}
                >
                  {t('join')}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
