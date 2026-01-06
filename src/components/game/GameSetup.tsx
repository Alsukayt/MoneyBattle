import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Logo from './Logo';
import { Copy, Check, Settings, Play } from 'lucide-react';

interface GameSetupProps {
  roomCode: string;
  isHost: boolean;
  hostNickname: string;
  guestNickname: string | null;
  onStartGame: (gridSize: number, coinAmount: number) => void;
}

const GRID_SIZES = [
  { value: 5, label: '5x5', description: 'Quick games' },
  { value: 8, label: '8x8', description: 'Balanced' },
  { value: 10, label: '10x10', description: 'Epic battles' },
];

const GameSetup = ({ 
  roomCode, 
  isHost, 
  hostNickname, 
  guestNickname, 
  onStartGame 
}: GameSetupProps) => {
  const [gridSize, setGridSize] = useState(5);
  const [coinAmount, setCoinAmount] = useState(100);
  const [copied, setCopied] = useState(false);

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    if (coinAmount < 10) return;
    onStartGame(gridSize, coinAmount);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Room Code Card */}
        <Card className="card-glow text-center">
          <p className="text-muted-foreground text-sm mb-2">Share this code with your friend:</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-mono font-black tracking-widest text-primary text-glow">
              {roomCode}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={copyRoomCode}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </Card>

        {/* Players Card */}
        <Card className="card-glow">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Players
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              <span className="font-medium">{hostNickname}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">Host</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
              {guestNickname ? (
                <>
                  <span className="font-medium">{guestNickname}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">Guest</span>
                </>
              ) : (
                <span className="text-muted-foreground italic">Waiting for player...</span>
              )}
            </div>
          </div>
        </Card>

        {/* Game Settings (Host Only) */}
        {isHost && (
          <Card className="card-glow">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Game Settings
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Grid Size</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {GRID_SIZES.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setGridSize(size.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        gridSize === size.value 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <div className="font-bold">{size.label}</div>
                      <div className="text-xs text-muted-foreground">{size.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="coins" className="text-foreground">Coins per Player</Label>
                <Input
                  id="coins"
                  type="number"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(Math.max(10, parseInt(e.target.value) || 10))}
                  min={10}
                  max={1000}
                  className="mt-1 bg-background border-border"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Start Button */}
        {isHost && (
          <Button 
            className="btn-gold w-full text-lg py-6"
            onClick={handleStart}
            disabled={!guestNickname}
          >
            <Play className="w-5 h-5 mr-2" />
            {guestNickname ? 'Start Game!' : 'Waiting for Player...'}
          </Button>
        )}

        {!isHost && (
          <Card className="card-glow text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Waiting for {hostNickname} to start the game...
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GameSetup;
