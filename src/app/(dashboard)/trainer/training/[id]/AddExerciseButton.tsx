'use client'

import { useState } from 'react'
import AddExerciseForm from './AddExerciseForm'

interface Props {
  workoutId: string
  exerciseCount: number
}

export default function AddExerciseButton({ workoutId, exerciseCount }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {!open && (
        <button
          className="btn-secondary btn-sm cursor-pointer mt-3 w-full"
          onClick={() => setOpen(true)}
        >
          + Añadir ejercicio
        </button>
      )}
      {open && (
        <AddExerciseForm
          workoutId={workoutId}
          orderIndex={exerciseCount}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
