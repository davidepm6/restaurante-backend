import type { Producto } from '../api/catalogo'

/** Minúsculas y sin tildes, para que «clasica» encuentre «clásica». */
export function normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

export function filtrarProductos(
    productos: Producto[],
    termino: string,
    categoriaId: number | null,
    limite = 50,
): Producto[] {
    const buscado = normalizar(termino)
    return productos
        .filter(
        (p) =>
            (categoriaId === null || p.categoria_id === categoriaId) &&
            (buscado === '' || normalizar(p.nombre).includes(buscado)),
        )
        .slice(0, limite)
}