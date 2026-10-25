import { Coins } from 'lucide-react';
import { useI18n } from '@/i18n';


const Logo = () => {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="relative">
        <div className="w-16 h-16 bg-primary border-4 border-b-8 border-r-8 border-primary/60 flex items-center justify-center">
          <Coins className="w-10 h-10 text-primary-foreground" />
        </div>
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-secondary border-2 border-secondary/60 animate-bounce" />
      </div>
      <div className="text-center mt-2">
        <h1 className="text-2xl sm:text-3xl tracking-tight leading-relaxed">
          <span className="text-primary text-glow block">DAPTS</span>
          <span className="text-foreground text-lg sm:text-xl block mt-1">{t('brandSub')}</span>
        </h1>
        <p className="text-muted-foreground text-xs mt-2">{t('tagline')}</p>
      </div>
    </div>
  );
};

export default Logo;