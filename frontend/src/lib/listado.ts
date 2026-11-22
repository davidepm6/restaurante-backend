import { normalizar } from './busqueda'

export const TAMANIO_LISTADO = 25

/** Filtra por texto sin distinguir mayúsculas ni tildes; sin término devuelve todo. */
export function filtrarPorTexto<T>(items: T[], termino: string, texto: (item: T) => string): T[] {
    const buscado = normalizar(termino)
    if (buscado === '') return items
    return items.filter((item) => normalizar(texto(item)).includes(buscado))
}

export interface PaginaLocal<T> {
    items: T[]
    pagina: number
    paginas: number
    total: number
}

/** Corta una lista en páginas. Una página fuera de rango se ajusta a la más cercana válida. */
export function paginar<T>(items: T[], pagina: number, tamanio: number): PaginaLocal<T> {
    const total = items.length
    const paginas = Math.max(1, Math.ceil(total / tamanio))
    const actual = Math.min(Math.max(1, Math.trunc(pagina) || 1), paginas)
    const desde = (actual - 1) * tamanio
    return { items: items.slice(desde, desde + tamanio), pagina: actual, paginas, total }
}