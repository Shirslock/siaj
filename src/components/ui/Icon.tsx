import {
  PlusIcon, ArrowLeftIcon, ArrowRightIcon, ArrowPathIcon,
  ArrowDownTrayIcon, ArrowUpTrayIcon, ArrowsRightLeftIcon,
  ArrowTrendingUpIcon, ArrowTopRightOnSquareIcon,
  ArrowTurnDownRightIcon, ArrowUturnRightIcon, Bars3Icon, BellIcon, BriefcaseIcon,
  CheckIcon, CheckCircleIcon, ChevronRightIcon, ChevronUpDownIcon,
  ChevronUpIcon, ClockIcon, CloudArrowUpIcon, ClipboardDocumentListIcon,
  DocumentCheckIcon, DocumentIcon, DocumentTextIcon, EllipsisVerticalIcon,
  ExclamationCircleIcon, ExclamationTriangleIcon, EyeIcon,
  FolderIcon, FolderMinusIcon, FolderOpenIcon, FolderArrowDownIcon,
  FunnelIcon, InboxIcon, InformationCircleIcon, LinkIcon,
  LinkSlashIcon, MagnifyingGlassIcon, MagnifyingGlassMinusIcon,
  NoSymbolIcon, PaperClipIcon, PencilSquareIcon, RectangleGroupIcon,
  Squares2X2Icon, TrashIcon, UserCircleIcon, UserPlusIcon,
  UsersIcon, WrenchScrewdriverIcon, XMarkIcon,
} from '@heroicons/react/24/outline'

function RadioButtonUncheckedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

const ICON_MAP: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  // Navegación
  add:                   PlusIcon,
  add_link:              LinkIcon,
  arrow_back:            ArrowLeftIcon,
  arrow_forward:         ArrowRightIcon,
  chevron_right:         ChevronRightIcon,
  close:                 XMarkIcon,
  menu:                  Bars3Icon,
  menu_open:             XMarkIcon,
  more_vert:             EllipsisVerticalIcon,
  unfold_more:           ChevronUpDownIcon,
  unfold_less:           ChevronUpIcon,
  swap_horiz:            ArrowsRightLeftIcon,
  open_in_new:           ArrowTopRightOnSquareIcon,
  forward:               ArrowUturnRightIcon,

  // Acciones
  check:                 CheckIcon,
  check_circle:          CheckCircleIcon,
  delete:                TrashIcon,
  download:              ArrowDownTrayIcon,
  edit:                  PencilSquareIcon,
  refresh:               ArrowPathIcon,
  save:                  CloudArrowUpIcon,
  upload_file:           ArrowUpTrayIcon,
  visibility:            EyeIcon,
  filter_alt_off:        FunnelIcon,
  search:                MagnifyingGlassIcon,
  search_off:            MagnifyingGlassMinusIcon,

  // Archivos y documentos
  assign_file:           DocumentCheckIcon,
  assignment:            ClipboardDocumentListIcon,
  attach_file:           PaperClipIcon,
  description:           DocumentTextIcon,
  picture_as_pdf:        DocumentIcon,

  // Carpetas
  folder:                FolderIcon,
  folder_off:            FolderMinusIcon,
  folder_open:           FolderOpenIcon,
  folder_shared:         FolderArrowDownIcon,

  // Comunicación y estado
  inbox:                 InboxIcon,
  info:                  InformationCircleIcon,
  link:                  LinkIcon,
  link_off:              LinkSlashIcon,
  notifications_none:    BellIcon,
  schedule:              ClockIcon,
  history:               ClockIcon,
  warning:               ExclamationTriangleIcon,
  error:                 ExclamationCircleIcon,

  // Personas
  person_add:            UserPlusIcon,
  person_search:         UserCircleIcon,
  people:                UsersIcon,

  radio_button_unchecked: RadioButtonUncheckedIcon,

  // Dashboard y layout
  account_tree:          RectangleGroupIcon,
  block:                 NoSymbolIcon,
  construction:          WrenchScrewdriverIcon,
  dashboard:             Squares2X2Icon,
  subdirectory_arrow_right: ArrowTurnDownRightIcon,
  trending_up:           ArrowTrendingUpIcon,
  work:                  BriefcaseIcon,
}

interface IconProps {
  name: string
  className?: string
  size?: number
}

export default function Icon({ name, className = '', size = 20 }: IconProps) {
  const HeroIcon = ICON_MAP[name]

  if (!HeroIcon) {
    if (import.meta.env.DEV) {
      console.warn(`Icon "${name}" not found in ICON_MAP`)
    }
    return (
      <span
        className={`inline-block text-[10px] font-mono text-[#b91c1c] ${className}`}
        title={`Missing icon: ${name}`}
      >
        [{name}]
      </span>
    )
  }

  return (
    <HeroIcon
      style={{ width: size, height: size }}
      className={`inline-block flex-shrink-0 ${className}`}
      aria-hidden="true"
    />
  )
}
