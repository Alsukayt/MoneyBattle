import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Logo from './Logo';
import { Trophy, Frown, RotateCcw, Home } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { GamePlayer, WinMode } from '@/types/game';

interface GameOverProps {
  isWinner: boolean;
  winnerName: string;
  winMode: WinMode;
  players: GamePlayer[];
  onPlayAgain: () => void;
  onGoHome: () => void;
}

const GameOver = ({ isWinner, winnerName, winMode, players, onPlayAgain, onGoHome }: GameOverProps) => {
  useEffect(() => {
    if (isWinner) {
      // Celebration confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF6B6B', '#9B59B6']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FF6B6B', '#9B59B6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [isWinner]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/10">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>

        <Card className="card-glow text-center space-y-6">
          {isWinner ? (
            <>
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-yellow-500 flex items-center justify-center shadow-[0_0_40px_hsl(45,100%,51%,0.5)]">
                <Trophy className="w-12 h-12 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-primary text-glow">VICTORY!</h2>
                <p className="text-xl text-foreground mt-2">{winnerName} wins!</p>
                <p className="text-muted-foreground mt-1">{winMode === 'most_coins' ? 'You collected the most coins!' : 'You are the last one standing!'}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-muted to-muted-foreground/50 flex items-center justify-center">
                <Frown className="w-12 h-12 text-foreground" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-muted-foreground">DEFEAT</h2>
                <p className="text-xl text-foreground mt-2">{winnerName} wins!</p>
                <p className="text-muted-foreground mt-1">Better luck next time!</p>
              </div>
            </>
          )}

          <div className="space-y-2 text-left">
            {[...players].sort((a, b) => b.coins_collected - a.coins_collected).map(p => (
              <div key={p.id} className="flex justify-between p-2 rounded bg-background/50 text-sm">
                <span>{p.nickname}{p.eliminated && ' (out)'}</span>
                <span className="text-primary">{p.coins_collected} coins</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={onGoHome}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button 
              className="btn-gold flex-1"
              onClick={onPlayAgain}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GameOver;
