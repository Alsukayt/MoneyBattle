import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useI18n } from '@/i18n';

interface Props {
  onNewGame: () => void;
  /** Skip the "are you sure?" step (used once the game is already over). */
  needsConfirm?: boolean;
}

/** Always-visible "new game" control, shown on every screen inside a room. */
const NewGameButton = ({ onNewGame, needsConfirm = true }: Props) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const btn = (onClick: () => void) => (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="fixed top-3 start-3 z-50 border-4 border-border bg-card hover:border-primary"
    >
      <Plus className="w-4 h-4 sm:me-1" />
      <span className="hidden sm:inline">{t('newGame')}</span>
    </Button>
  );

  if (!needsConfirm) return btn(onNewGame);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{btn(() => setOpen(true))}</AlertDialogTrigger>
      <AlertDialogContent className="border-4 border-border">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('newGameQ')}</AlertDialogTitle>
          <AlertDialogDescription>{t('newGameDesc')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="border-4 border-border">{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction className="btn-gold" onClick={onNewGame}>
            {t('newGameYes')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default NewGameButton;
