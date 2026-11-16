import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataTable, type Columna } from './DataTable'

interface Fila { id: number; nombre: string }
const columnas: Columna<Fila>[] = [{ clave: 'nombre', titulo: 'Nombre', celda: (f) => f.nombre }]

describe('DataTable', () => {
    it('muestra las filas', () => {
        render(<DataTable columnas={columnas} filas={[{ id: 1, nombre: 'Limonada' }]} claveFila={(f) => f.id} />)
        expect(screen.getByText('Limonada')).toBeInTheDocument()
    })

    it('muestra el estado vacío', () => {
        render(<DataTable columnas={columnas} filas={[]} claveFila={(f) => f.id} />)
        expect(screen.getByText('No hay registros para mostrar.')).toBeInTheDocument()
    })

    it('muestra el estado de carga', () => {
        render(<DataTable columnas={columnas} filas={[]} claveFila={(f) => f.id} cargando />)
        expect(screen.getByText('Cargando…')).toBeInTheDocument()
    })
})