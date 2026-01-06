import { Coins } from 'lucide-react';

const Logo = () => {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className="relative">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-yellow-500 flex items-center justify-center shadow-lg">
          <Coins className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary animate-pulse" />
      </div>
      <div>
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-primary text-glow">DAPTS</span>
          <span className="text-foreground ml-1">Money Battle</span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium">Hunt the coins, win the game!</p>
      </div>
    </div>
  );
};

export default Logo;
