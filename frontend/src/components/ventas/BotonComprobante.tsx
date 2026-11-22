import { Button } from '../ui/Button'
import { useComprobante } from './useComprobante'

export function BotonComprobante({ ventaId }: { ventaId: number }) {
    const { descargar, descargando } = useComprobante()
    return (
        <Button variante="ghost" onClick={() => descargar(ventaId)} cargando={descargando}>
        Descargar comprobante
        </Button>
    )
}