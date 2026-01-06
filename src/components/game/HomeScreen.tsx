import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Logo from './Logo';
import { Plus, Users } from 'lucide-react';

interface HomeScreenProps {
  onCreateGame: (nickname: string) => void;
  onJoinGame: (nickname: string, roomCode: string) => void;
}

const HomeScreen = ({ onCreateGame, onJoinGame }: HomeScreenProps) => {
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!nickname.trim()) {
      setError('Please enter your nickname');
      return;
    }
    onCreateGame(nickname.trim());
  };

  const handleJoin = () => {
    if (!nickname.trim()) {
      setError('Please enter your nickname');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter the room code');
      return;
    }
    onJoinGame(nickname.trim(), roomCode.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>

        {mode === 'home' && (
          <Card className="card-glow space-y-4">
            <h2 className="text-xl font-bold text-center text-foreground">Welcome, Player!</h2>
            <p className="text-muted-foreground text-center text-sm">
              Hide your coins, hunt your opponent's treasure. First to find all coins wins!
            </p>
            <div className="space-y-3 pt-4">
              <Button 
                className="btn-gold w-full text-lg"
                onClick={() => setMode('create')}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Game
              </Button>
              <Button 
                className="btn-purple w-full text-lg"
                onClick={() => setMode('join')}
              >
                <Users className="w-5 h-5 mr-2" />
                Join Game
              </Button>
            </div>
          </Card>
        )}

        {mode === 'create' && (
          <Card className="card-glow space-y-4">
            <h2 className="text-xl font-bold text-foreground">Create New Game</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nickname" className="text-foreground">Your Nickname</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your name..."
                  className="mt-1 bg-background border-border"
                  maxLength={20}
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setMode('home')}
                >
                  Back
                </Button>
                <Button 
                  className="btn-gold flex-1"
                  onClick={handleCreate}
                >
                  Create Game
                </Button>
              </div>
            </div>
          </Card>
        )}

        {mode === 'join' && (
          <Card className="card-glow space-y-4">
            <h2 className="text-xl font-bold text-foreground">Join Game</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="join-nickname" className="text-foreground">Your Nickname</Label>
                <Input
                  id="join-nickname"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your name..."
                  className="mt-1 bg-background border-border"
                  maxLength={20}
                />
              </div>
              <div>
                <Label htmlFor="room-code" className="text-foreground">Room Code</Label>
                <Input
                  id="room-code"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="ABCD12"
                  className="mt-1 bg-background border-border uppercase tracking-widest text-center text-lg font-mono"
                  maxLength={6}
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setMode('home')}
                >
                  Back
                </Button>
                <Button 
                  className="btn-purple flex-1"
                  onClick={handleJoin}
                >
                  Join Game
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
