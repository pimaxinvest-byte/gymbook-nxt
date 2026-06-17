'use client'

import { useState } from 'react'
import AddWorkoutForm from './AddWorkoutForm'

interface Props {
  programId: string
}

export default function AddWorkoutButton({ programId }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="btn-secondary btn-sm cursor-pointer"
        onClick={() => setOpen(true)}
      >
        + Añadir sesión
      </button>
      {open && (
        <AddWorkoutForm
          programId={programId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
