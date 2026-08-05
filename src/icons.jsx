const iconFiles = {
  Activity: 'activity',
  AlertCircle: 'alert-circle',
  ArrowLeft: 'arrow-left',
  ArrowUpRight: 'arrow-up-right',
  Bell: 'bell',
  BookOpen: 'book-2',
  BookOpenCheck: 'book-2',
  Bot: 'robot',
  Brain: 'brain',
  CalendarClock: 'calendar-time',
  Check: 'check',
  CheckCircle2: 'circle-check',
  ChevronDown: 'chevron-down',
  CircleUserRound: 'user-circle',
  Clock3: 'clock',
  CloudUpload: 'cloud-upload',
  Code2: 'code',
  DeviceFloppy: 'device-floppy',
  Edit: 'edit',
  Eye: 'eye',
  EyeOff: 'eye-off',
  FileInput: 'file-import',
  FilePlus2: 'file-plus',
  FileText: 'file-text',
  FolderOpen: 'folder-open',
  Heart: 'heart',
  Home: 'home',
  KeyRound: 'key',
  Layers3: 'layers-subtract',
  LoaderCircle: 'loader-2',
  Menu: 'menu-2',
  MessageCircle: 'message-circle',
  MessageCircleReply: 'message-reply',
  Minus: 'minus',
  MoreHorizontal: 'dots',
  Pause: 'player-pause',
  PenLine: 'edit',
  Pencil: 'pencil',
  Play: 'player-play',
  Plus: 'plus',
  RefreshCw: 'refresh',
  RotateCcw: 'rotate',
  Save: 'device-floppy',
  Search: 'search',
  Send: 'send',
  Settings2: 'settings',
  Share2: 'share-3',
  ShieldCheck: 'shield-check',
  Sparkles: 'sparkles',
  Tag: 'tag',
  Trash2: 'trash',
  TrendingUp: 'trending-up',
  UploadCloud: 'upload',
  Users: 'users',
  X: 'x',
  Zap: 'bolt',
};

const filledFiles = new Set(['Heart']);

export function TablerIcon({ name, size = 24, fill = 'none', className = '', style, strokeWidth: _strokeWidth, absoluteStrokeWidth: _absoluteStrokeWidth, ...rest }) {
  const file = iconFiles[name] || 'sparkles';
  const variant = fill && fill !== 'none' && filledFiles.has(name) ? 'filled' : 'outline';
  const url = `/icons/tabler/${variant}/${file}.svg`;
  return (
    <span
      className={`tabler-icon ${className}`.trim()}
      style={{ ...style, '--icon-size': `${size}px`, '--icon-mask': `url("${url}")` }}
      aria-hidden={rest['aria-label'] ? undefined : true}
      {...rest}
    />
  );
}

function createIcon(name) {
  const Icon = (props) => <TablerIcon name={name} {...props} />;
  Icon.displayName = name;
  return Icon;
}

export const Activity = createIcon('Activity');
export const AlertCircle = createIcon('AlertCircle');
export const ArrowLeft = createIcon('ArrowLeft');
export const ArrowUpRight = createIcon('ArrowUpRight');
export const Bell = createIcon('Bell');
export const BookOpen = createIcon('BookOpen');
export const BookOpenCheck = createIcon('BookOpenCheck');
export const Bot = createIcon('Bot');
export const Brain = createIcon('Brain');
export const CalendarClock = createIcon('CalendarClock');
export const Check = createIcon('Check');
export const CheckCircle2 = createIcon('CheckCircle2');
export const ChevronDown = createIcon('ChevronDown');
export const CircleUserRound = createIcon('CircleUserRound');
export const Clock3 = createIcon('Clock3');
export const CloudUpload = createIcon('CloudUpload');
export const Code2 = createIcon('Code2');
export const Eye = createIcon('Eye');
export const EyeOff = createIcon('EyeOff');
export const FileInput = createIcon('FileInput');
export const FilePlus2 = createIcon('FilePlus2');
export const FileText = createIcon('FileText');
export const FolderOpen = createIcon('FolderOpen');
export const Heart = createIcon('Heart');
export const Home = createIcon('Home');
export const KeyRound = createIcon('KeyRound');
export const Layers3 = createIcon('Layers3');
export const LoaderCircle = createIcon('LoaderCircle');
export const Menu = createIcon('Menu');
export const MessageCircle = createIcon('MessageCircle');
export const MessageCircleReply = createIcon('MessageCircleReply');
export const Minus = createIcon('Minus');
export const MoreHorizontal = createIcon('MoreHorizontal');
export const Pause = createIcon('Pause');
export const PenLine = createIcon('PenLine');
export const Pencil = createIcon('Pencil');
export const Play = createIcon('Play');
export const Plus = createIcon('Plus');
export const RefreshCw = createIcon('RefreshCw');
export const RotateCcw = createIcon('RotateCcw');
export const Save = createIcon('Save');
export const Search = createIcon('Search');
export const Send = createIcon('Send');
export const Settings2 = createIcon('Settings2');
export const Share2 = createIcon('Share2');
export const ShieldCheck = createIcon('ShieldCheck');
export const Sparkles = createIcon('Sparkles');
export const Tag = createIcon('Tag');
export const Trash2 = createIcon('Trash2');
export const TrendingUp = createIcon('TrendingUp');
export const UploadCloud = createIcon('UploadCloud');
export const Users = createIcon('Users');
export const X = createIcon('X');
export const Zap = createIcon('Zap');
