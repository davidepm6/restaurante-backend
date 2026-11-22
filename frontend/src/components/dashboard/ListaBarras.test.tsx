import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ListaBarras } from './ListaBarras'

describe('ListaBarras', () => {
    it('muestra cada elemento con su texto', () => {
        render(
        <ListaBarras
            items={[
            { clave: 1, etiqueta: 'Efectivo', valor: 100, texto: '$100 · 4 ventas' },
            { clave: 2, etiqueta: 'Tarjeta', valor: 50, texto: '$50 · 2 ventas' },
            ]}
        />,
        )
        expect(screen.getAllByRole('listitem')).toHaveLength(2)
        expect(screen.getByText('Efectivo')).toBeInTheDocument()
        expect(screen.getByText('$50 · 2 ventas')).toBeInTheDocument()
    })

    it('la barra más larga ocupa todo el ancho y las demás son proporcionales', () => {
        const { container } = render(
        <ListaBarras
            items={[
            { clave: 1, etiqueta: 'A', valor: 200, texto: '' },
            { clave: 2, etiqueta: 'B', valor: 50, texto: '' },
            ]}
        />,
        )
        const barras = Array.from(container.querySelectorAll<HTMLElement>('[style*="width"]'))
        expect(barras.map((b) => b.style.width)).toEqual(['100%', '25%'])
    })

    it('con valores en cero no se rompe', () => {
        const { container } = render(<ListaBarras items={[{ clave: 1, etiqueta: 'A', valor: 0, texto: '' }]} />)
        expect(container.querySelector<HTMLElement>('[style*="width"]')!.style.width).toBe('0%')
    })
})