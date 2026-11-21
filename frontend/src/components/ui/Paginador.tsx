import { rangoMostrado } from '../../lib/paginacion'
import { Button } from './Button'
import styles from './Paginador.module.css'

interface PaginadorProps {
    pagina: number
    paginas: number
    tamanio: number
    total: number
    onCambiar: (pagina: number) => void
    deshabilitado?: boolean
    }

    export function Paginador({ pagina, paginas, tamanio, total, onCambiar, deshabilitado = false }: PaginadorProps) {
    const { desde, hasta } = rangoMostrado(pagina, tamanio, total)

    return (
        <nav className={styles.paginador} aria-label="Paginación">
        <p className={styles.estado} aria-live="polite">
            {total === 0 ? 'Sin resultados' : `Mostrando ${desde}–${hasta} de ${total}`}
        </p>
        <div className={styles.botones}>
            <Button variante="ghost" onClick={() => onCambiar(pagina - 1)} disabled={deshabilitado || pagina <= 1}>
            Anterior
            </Button>
            <span className={styles.pagina}>
            Página {pagina} de {paginas}
            </span>
            <Button variante="ghost" onClick={() => onCambiar(pagina + 1)} disabled={deshabilitado || pagina >= paginas}>
            Siguiente
            </Button>
        </div>
        </nav>
    )
}