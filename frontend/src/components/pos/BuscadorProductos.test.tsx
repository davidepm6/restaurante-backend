import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Categoria, Producto } from '../../api/catalogo'
import { BuscadorProductos } from './BuscadorProductos'

const PRODUCTOS: Producto[] = [
    { id: 1, nombre: 'Limonada natural', precio: 6000, stock: 5, stock_minimo: 0, stock_bajo: false, categoria_id: 1, activo: true, creado_en: '' },
    { id: 2, nombre: 'Hamburguesa clásica', precio: 22000, stock: 8, stock_minimo: 10, stock_bajo: true, categoria_id: 2, activo: true, creado_en: '' },
    { id: 3, nombre: 'Brownie', precio: 12000, stock: 0, stock_minimo: 0, stock_bajo: false, categoria_id: 2, activo: true, creado_en: '' },
    ]
    const CATEGORIAS: Categoria[] = [
    { id: 1, nombre: 'Bebidas', descripcion: null, creado_en: '' },
    { id: 2, nombre: 'Platos', descripcion: null, creado_en: '' },
    ]

    // Solo los resultados de la búsqueda: las opciones de la lista de categorías no cuentan.
    const lista = () => within(screen.getByRole('listbox', { name: 'Resultados' }))
    const opciones = () => lista().getAllByRole('option')

    function montar() {
    const onElegir = vi.fn()
    render(
        <BuscadorProductos productos={PRODUCTOS} categorias={CATEGORIAS} cantidadEnPedido={() => 0} onElegir={onElegir} />,
    )
    return {
        user: userEvent.setup(),
        onElegir,
        buscador: screen.getByRole('combobox', { name: 'Buscar producto' }),
    }
    }

    describe('BuscadorProductos', () => {
    it('muestra todos los productos cuando no se ha escrito nada', () => {
        montar()
        expect(opciones()).toHaveLength(3)
    })

    it('filtra mientras se escribe, sin distinguir tildes ni mayúsculas', async () => {
        const { user, buscador } = montar()
        await user.type(buscador, 'CLASICA')
        expect(opciones()).toHaveLength(1)
        expect(opciones()[0]).toHaveTextContent('Hamburguesa clásica')
    })

    it('Enter elige el resultado resaltado y limpia la búsqueda', async () => {
        const { user, onElegir, buscador } = montar()
        await user.type(buscador, 'limo{Enter}')
        expect(onElegir).toHaveBeenCalledWith(PRODUCTOS[0])
        expect(buscador).toHaveValue('')
    })

    it('las flechas cambian el resultado resaltado', async () => {
        const { user, onElegir, buscador } = montar()
        await user.click(buscador)
        await user.keyboard('{ArrowDown}')
        expect(opciones()[1]).toHaveAttribute('aria-selected', 'true')
        await user.keyboard('{Enter}')
        expect(onElegir).toHaveBeenCalledWith(PRODUCTOS[1])
    })

    it('Escape limpia la búsqueda', async () => {
        const { user, buscador } = montar()
        await user.type(buscador, 'limo')
        await user.keyboard('{Escape}')
        expect(buscador).toHaveValue('')
    })

    it('también se puede elegir con un clic', async () => {
        const { user, onElegir } = montar()
        await user.click(lista().getByRole('option', { name: /Hamburguesa/ }))
        expect(onElegir).toHaveBeenCalledWith(PRODUCTOS[1])
    })

    it('filtra por categoría', async () => {
        const { user } = montar()
        await user.selectOptions(screen.getByLabelText('Categoría'), '1')
        expect(opciones()).toHaveLength(1)
        expect(opciones()[0]).toHaveTextContent('Limonada natural')
    })

    it('marca como agotado un producto sin stock', () => {
        montar()
        expect(lista().getByRole('option', { name: /Brownie/ })).toHaveAttribute('aria-disabled', 'true')
    })

    it('marca los productos con stock bajo y solo esos', () => {
        montar()
        expect(lista().getByRole('option', { name: /Hamburguesa/ })).toHaveTextContent('stock bajo')
        expect(lista().getByRole('option', { name: /Limonada/ })).not.toHaveTextContent('stock bajo')
    })

    it('avisa cuando no hay resultados', async () => {
        const { user, buscador } = montar()
        await user.type(buscador, 'zzz')
        expect(screen.getByRole('status')).toHaveTextContent('Sin resultados')
    })
})