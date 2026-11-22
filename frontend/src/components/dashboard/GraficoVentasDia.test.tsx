import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { VentaDia } from '../../api/dashboard'
import { GraficoVentasDia } from './GraficoVentasDia'

vi.mock('recharts', async () => {
    const React = await import('react')
    const Contenedor = ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children)
    const Nada = () => null
    return { ResponsiveContainer: Contenedor, BarChart: Contenedor, CartesianGrid: Nada, XAxis: Nada, YAxis: Nada, Tooltip: Nada, Bar: Nada }
    })

    const DATOS: VentaDia[] = [
    { fecha: '2026-11-19', ventas: 0, total: 0 },
    { fecha: '2026-11-20', ventas: 3, total: 18000 },
    { fecha: '2026-11-21', ventas: 2, total: 12000 },
    ]

    describe('GraficoVentasDia', () => {
    it('describe el gráfico para los lectores de pantalla, con el total', () => {
        render(<GraficoVentasDia datos={DATOS} />)
        const grafico = screen.getByRole('img')
        expect(grafico).toHaveAccessibleName(/últimos 3 días/)
        expect(grafico).toHaveAccessibleName(/30\.000/)
    })

    it('ofrece los mismos datos en una tabla, con los días sin ventas incluidos', () => {
        render(<GraficoVentasDia datos={DATOS} />)
        const filas = within(screen.getByRole('table')).getAllByRole('row')
        expect(filas).toHaveLength(4) // encabezado + 3 días
        expect(within(filas[1]).getByText('19 nov')).toBeInTheDocument()
        expect(within(filas[2]).getByText(/18\.000/)).toBeInTheDocument()
    })

    it('sin ventas en el período lo dice en lugar de dibujar un gráfico vacío', () => {
        render(<GraficoVentasDia datos={DATOS.map((d) => ({ ...d, ventas: 0, total: 0 }))} />)
        expect(screen.getByText('No hay ventas en este período.')).toBeInTheDocument()
        expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
})