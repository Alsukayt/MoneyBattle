import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Lang = 'en' | 'ar';

const en = {
  brandSub: 'MONEY BATTLE',
  tagline: 'HUNT THE COINS!',
  welcome: 'WELCOME PLAYER!',
  intro: "Hide your coins, hunt your opponent's treasure!",
  createGame: 'CREATE GAME',
  joinGame: 'JOIN GAME',
  nickname: 'NICKNAME',
  enterName: 'ENTER NAME...',
  roomCode: 'ROOM CODE',
  back: 'BACK',
  create: 'CREATE',
  join: 'JOIN',
  errNickname: 'Please enter your nickname',
  errCode: 'Please enter the room code',
  shareCode: 'Share this code with your friends:',
  players: 'Players',
  host: 'Host',
  waitingMore: 'Waiting for more players...',
  settings: 'Game Settings',
  gridSize: 'Grid Size',
  quick: 'Quick games',
  balanced: 'Balanced',
  epic: 'Epic battles',
  howToWin: 'How to Win',
  lastStanding: 'Last one standing',
  lastStandingDesc: 'Players are out when all their coins are found',
  mostCoins: 'Most coins',
  mostCoinsDesc: 'Ends when one player is wiped out; top collector wins',
  coinsPerPlayer: 'Coins per Player',
  startGame: 'Start Game ({n} players)',
  waitingPlayers: 'Waiting for Players...',
  waitingHost: 'Waiting for {name} to start the game...',
  coinsToPlace: 'Your coins to place:',
  otherPlayers: 'other players',
  ready: '✓ Ready!',
  placing: 'Placing coins...',
  cellSelected: 'Cell ({x}, {y}) selected',
  clickCells: 'Click on cells to hide your coins!',
  coinsForCell: 'Coins for cell ({x}, {y})',
  max: 'Max: {n}',
  place: 'Place',
  imReady: "I'm Ready!",
  placeRemaining: 'Place all {n} remaining coins',
  youReady: "You're ready! Waiting for {name}...",
  youOut: "You're out — watching {name}'s turn",
  yourTurn: 'Your Turn - Pick a target!',
  endTurn: 'End Turn',
  theirTurn: "{name}'s Turn...",
  winMostCoins: 'Most coins collected wins',
  winLastStanding: 'Last one standing wins',
  you: 'You',
  collected: 'Collected {n}',
  out: ' (out)',
  gridOf: "{name}'s Grid",
  noTarget: 'No target',
  yourGrid: 'Your Grid',
  victory: 'VICTORY!',
  defeat: 'DEFEAT',
  wins: '{name} wins!',
  youMost: 'You collected the most coins!',
  youLast: 'You are the last one standing!',
  betterLuck: 'Better luck next time!',
  coins: '{n} coins',
  home: 'Home',
  playAgain: 'Play Again',
  loading: 'Loading...',
  tCreateFail: 'Failed to create game. Try again!',
  tNotFound: 'Room not found! Check the code and try again.',
  tStarted: 'This game already started!',
  tJoinFail: 'Failed to join game. Try again!',
  tHit: 'Hit! Found {n} coins!',
  tMiss: 'Miss! No coins there.',
  tTurnEnded: 'Turn ended.',
  tEliminated: 'All your coins were found! You are out.',
};

export type TKey = keyof typeof en;

const ar: Record<TKey, string> = {
  brandSub: 'معركة الفلوس',
  tagline: 'دوّر على الفلوس!',
  welcome: 'هلا والله باللاعب!',
  intro: 'خبّ فلوسك، ودوّر على كنز خصمك!',
  createGame: 'سوّ لعبة',
  joinGame: 'ادخل لعبة',
  nickname: 'اسمك',
  enterName: 'اكتب اسمك...',
  roomCode: 'كود الغرفة',
  back: 'رجوع',
  create: 'يلا نسويها',
  join: 'دخّلني',
  errNickname: 'تكفى اكتب اسمك',
  errCode: 'تكفى اكتب كود الغرفة',
  shareCode: 'أرسل هالكود لربعك:',
  players: 'اللاعبين',
  host: 'المضيف',
  waitingMore: 'ننتظر يجون لاعبين زيادة...',
  settings: 'إعدادات اللعبة',
  gridSize: 'حجم اللوحة',
  quick: 'لعبة سريعة',
  balanced: 'متوسطة',
  epic: 'معركة طويلة',
  howToWin: 'كيف تفوز',
  lastStanding: 'آخر واحد يصمد',
  lastStandingDesc: 'اللي تنلقى كل فلوسه يطلع من اللعبة',
  mostCoins: 'أكثر فلوس',
  mostCoinsDesc: 'تخلص لما واحد يفلس، واللي جمع أكثر يفوز',
  coinsPerPlayer: 'الفلوس لكل لاعب',
  startGame: 'ابدأ اللعبة ({n} لاعبين)',
  waitingPlayers: 'ننتظر اللاعبين...',
  waitingHost: 'ننتظر {name} يبدأ اللعبة...',
  coinsToPlace: 'فلوسك اللي باقي تخبيها:',
  otherPlayers: 'باقي اللاعبين',
  ready: '✓ جاهز!',
  placing: 'قاعد يخبي فلوسه...',
  cellSelected: 'اخترت الخانة ({x}، {y})',
  clickCells: 'اضغط على الخانات وخبّ فلوسك!',
  coinsForCell: 'كم تبي تحط بالخانة ({x}، {y})',
  max: 'الحد: {n}',
  place: 'حطها',
  imReady: 'أنا جاهز!',
  placeRemaining: 'باقي {n} لازم تخبيها',
  youReady: 'أنت جاهز! ننتظر {name}...',
  youOut: 'طلعت من اللعبة — تتفرج على دور {name}',
  yourTurn: 'دورك - اختار خصمك!',
  endTurn: 'خلّص دوري',
  theirTurn: 'دور {name}...',
  winMostCoins: 'اللي يجمع أكثر فلوس يفوز',
  winLastStanding: 'آخر واحد يصمد يفوز',
  you: 'أنت',
  collected: 'جمع {n}',
  out: ' (طلع)',
  gridOf: 'لوحة {name}',
  noTarget: 'ما فيه خصم',
  yourGrid: 'لوحتك',
  victory: 'فزت يا بطل!',
  defeat: 'خسرت!',
  wins: '{name} فاز!',
  youMost: 'جمعت أكثر فلوس!',
  youLast: 'أنت آخر واحد صامد!',
  betterLuck: 'معليش، المرة الجاية لك!',
  coins: '{n} ريال',
  home: 'الرئيسية',
  playAgain: 'نلعب مرة ثانية',
  loading: 'لحظة...',
  tCreateFail: 'ما قدرنا نسوي اللعبة، جرب مرة ثانية!',
  tNotFound: 'ما لقينا الغرفة! تأكد من الكود.',
  tStarted: 'اللعبة بدت خلاص!',
  tJoinFail: 'ما قدرنا ندخلك، جرب مرة ثانية!',
  tHit: 'صادتها! لقيت {n} ريال!',
  tMiss: 'طاشت! ما فيه شي هنا.',
  tTurnEnded: 'خلص دورك.',
  tEliminated: 'انلقت كل فلوسك! طلعت من اللعبة.',
};

const dicts = { en, ar };

export const translate = (lang: Lang, key: TKey, vars?: Record<string, string | number>) => {
  let s = dicts[lang][key];
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey, v?: Record<string, string | number>) => string };
const I18nContext = createContext<Ctx | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'ar');
  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);
  return (
    <I18nContext.Provider value={{ lang, setLang, t: (k, v) => translate(lang, k, v) }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const c = useContext(I18nContext);
  if (!c) throw new Error('useI18n outside provider');
  return c;
};

export const LanguageToggle = () => {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      className="fixed top-3 end-3 z-50 px-3 py-2 border-4 border-border bg-card text-foreground text-xs hover:border-primary"
    >
      {lang === 'ar' ? 'English' : 'عربي'}
    </button>
  );
};
