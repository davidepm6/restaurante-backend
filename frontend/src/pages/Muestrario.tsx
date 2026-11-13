import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { DataTable, type Columna } from '../components/ui/DataTable'
import { Dialog } from '../components/ui/Dialog'
import { Field } from '../components/ui/Field'
import { useToast } from '../components/ui/toast-context'
import { formatoMoneda } from '../lib/format'
import styles from './Muestrario.module.css'

interface ProductoDemo { id: number; nombre: string; precio: number; stock: number }

const PRODUCTOS: ProductoDemo[] = [
    { id: 1, nombre: 'Hamburguesa clásica', precio: 22000, stock: 30 },
    { id: 2, nombre: 'Limonada natural', precio: 6000, stock: 60 },
    ]

    const COLUMNAS: Columna<ProductoDemo>[] = [
    { clave: 'nombre', titulo: 'Producto', celda: (p) => p.nombre },
    { clave: 'precio', titulo: 'Precio', celda: (p) => formatoMoneda(p.precio), alinear: 'derecha' },
    { clave: 'stock', titulo: 'Stock', celda: (p) => p.stock, alinear: 'derecha' },
    ]

    export default function Muestrario() {
    const { avisar } = useToast()
    const [dialogoAbierto, setDialogoAbierto] = useState(false)

    return (
        <>
        <div className="page-head">
            <h2>Muestrario</h2>
            <p className="page-sub">Solo visible en desarrollo. Sirve para revisar los componentes base.</p>
        </div>
        <div className="ticket-divider" />

        <section className={styles.bloque}>
            <h3>Botones</h3>
            <div className={styles.fila}>
            <Button>Primario</Button>
            <Button variante="secundario">Secundario</Button>
            <Button variante="ghost">Ghost</Button>
            <Button variante="peligro">Peligro</Button>
            <Button cargando>Guardando</Button>
            <Button disabled>Deshabilitado</Button>
            </div>
        </section>

        <section className={styles.bloque}>
            <h3>Campos</h3>
            <div className={styles.campos}>
            <Field etiqueta="Nombre" placeholder="Ej.: Limonada natural" />
            <Field etiqueta="Stock" type="number" ayuda="Unidades disponibles" />
            <Field etiqueta="Precio" type="number" error="El precio debe ser mayor que cero" />
            </div>
        </section>

        <section className={styles.bloque}>
            <h3>Tabla</h3>
            <DataTable columnas={COLUMNAS} filas={PRODUCTOS} claveFila={(p) => p.id} />
        </section>

        <section className={styles.bloque}>
            <h3>Diálogo y avisos</h3>
            <div className={styles.fila}>
            <Button variante="peligro" onClick={() => setDialogoAbierto(true)}>Abrir diálogo</Button>
            <Button variante="ghost" onClick={() => avisar('Cambios guardados', 'ok')}>Aviso de éxito</Button>
            <Button variante="ghost" onClick={() => avisar('No se pudo guardar. Intenta de nuevo.', 'error')}>Aviso de error</Button>
            </div>
        </section>

        <Dialog
            abierto={dialogoAbierto}
            titulo="Eliminar producto"
            textoConfirmar="Eliminar"
            peligro
            onConfirmar={() => {
            setDialogoAbierto(false)
            avisar('Producto eliminado', 'ok')
            }}
            onCancelar={() => setDialogoAbierto(false)}
        >
            Esta acción no se puede deshacer.
        </Dialog>
        </>
    )
}