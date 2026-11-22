import { useCallback, useState } from 'react'
import { useDescargarArchivo } from '../../api/descargas'
import { mensajeDescarga, nombreComprobante } from '../../lib/descarga'
import { useToast } from '../ui/toast-context'

/** Descarga el comprobante de una venta, mostrando un aviso si algo falla. */
export function useComprobante() {
    const descargarArchivo = useDescargarArchivo()
    const { avisar } = useToast()
    const [descargando, setDescargando] = useState(false)

    const descargar = useCallback(
        async (ventaId: number) => {
        setDescargando(true)
        try {
            await descargarArchivo(`/ventas/${ventaId}/comprobante`, nombreComprobante(ventaId))
        } catch (error) {
            avisar(mensajeDescarga(error), 'error')
        } finally {
            setDescargando(false)
        }
        },
        [descargarArchivo, avisar],
    )

    return { descargar, descargando }
}