import { useNavigate } from 'react-router-dom'
import { RUTAS } from '../../utils/routing'
import bogaAvatar from '../../assets/boga-avatar.jpg'

export function BogaFab() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(RUTAS.BOGA)}
      title="Chatear con Boga"
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-card-lg border border-[rgba(0,0,0,0.08)] overflow-hidden bg-white hover:scale-105 transition-transform z-50 flex items-center justify-center"
    >
      <img src={bogaAvatar} alt="Boga" className="w-full h-full object-cover" />
    </button>
  )
}
