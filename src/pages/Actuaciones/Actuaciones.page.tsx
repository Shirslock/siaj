import { useState } from 'react'
import { useUIStore } from '../../store/ui.store'
import BandejaAbogadoPage from '../BandejaAbogado/BandejaAbogado.page'
import BandejaAreaPage from '../BandejaArea/BandejaArea.page'

function ActuacionesCoordinador() {
  const [tabActivo, setTabActivo] = useState<'mis' | 'area'>('mis')

  return (
    <div>
      <div className="px-6 pt-6">
        <div className="flex gap-1 bg-[#f5f5f5] rounded-xl p-1 mb-4">
          {(['mis', 'area'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setTabActivo(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                tabActivo === tab
                  ? 'bg-white text-[#1b3a57] shadow-sm'
                  : 'text-[#4a6a84] hover:text-[#1b3a57]'
              }`}
            >
              {tab === 'mis' ? 'Mis Actuaciones' : 'Del Área'}
            </button>
          ))}
        </div>
      </div>
      {tabActivo === 'mis' ? <BandejaAbogadoPage /> : <BandejaAreaPage />}
    </div>
  )
}

export default function ActuacionesPage() {
  const { usuarioActivo } = useUIStore()
  const rol = usuarioActivo?.rolSistema

  if (rol === 'COORDINADOR') return <ActuacionesCoordinador />
  if (rol === 'REFERENTE') return <BandejaAreaPage />
  return <BandejaAbogadoPage />
}
