import { useEffect, useReducer, useState } from 'react'
import type { Dispatch } from 'react'
import { useCategorias, useProductos } from '../api/catalogo'
import { useRegistrarVenta, type Venta } from '../api/ventas'
import { BuscadorProductos } from '../components/pos/BuscadorProductos'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/toast-context'
import { mensajeDeError } from '../lib/errores'
import { formatoMoneda } from '../lib/format'
import {
    aItemsVenta,
    limitarCantidad,
    pedidoReducer,
    puedeAgregar,
    subtotal,
    totalPedido,
    type AccionPedido,
    type LineaPedido,
    } from '../lib/pedido'
    import type { Producto } from '../api/catalogo'
    import styles from './PuntoDeVenta.module.css'

    function LineaPedidoFila({ linea, despachar }: { linea: LineaPedido; despachar: Dispatch<AccionPedido> }) {
    // Mientras se escribe, se muestra lo tecleado; al salir del campo vuelve el valor real.
    const [edicion, setEdicion] = useState<string | null>(null)
    const valor = edicion ?? String(linea.cantidad)

    function cambiarTexto(texto: string) {
        setEdicion(texto)
        if (/^\d+$/.test(texto) && Number(texto) >= 1) {
        const limitada = limitarCantidad(Number(texto), linea.stock)
        despachar({ tipo: 'cantidad', productoId: linea.productoId, cantidad: limitada })
        setEdicion(String(limitada))
        }
    }

    return (
        <li className={styles.linea}>
        <div className={styles.lineaInfo}>
            <span className={styles.lineaNombre}>{linea.nombre}</span>
            <span className={styles.lineaPrecio}>{formatoMoneda(linea.precio)} c/u</span>
        </div>

        <div className={styles.cantidad}>
            <button
            type="button"
            className={styles.paso}
            aria-label={`Disminuir cantidad de ${linea.nombre}`}
            disabled={linea.cantidad <= 1}
            onClick={() => despachar({ tipo: 'cantidad', productoId: linea.productoId, cantidad: linea.cantidad - 1 })}
            >
            −
            </button>
            <input
            type="text"
            inputMode="numeric"
            className={styles.campoCantidad}
            aria-label={`Cantidad de ${linea.nombre}`}
            value={valor}
            onChange={(e) => cambiarTexto(e.target.value)}
            onBlur={() => setEdicion(null)}
            />
            <button
            type="button"
            className={styles.paso}
            aria-label={`Aumentar cantidad de ${linea.nombre}`}
            disabled={linea.cantidad >= linea.stock}
            onClick={() => despachar({ tipo: 'cantidad', productoId: linea.productoId, cantidad: linea.cantidad + 1 })}
            >
            +
            </button>
        </div>

        <div className={styles.lineaTotal}>
            <strong>{formatoMoneda(subtotal(linea))}</strong>
            {linea.cantidad >= linea.stock && <span className={styles.tope}>Máximo disponible</span>}
        </div>

        <button
            type="button"
            className={styles.quitar}
            aria-label={`Quitar ${linea.nombre} del pedido`}
            onClick={() => despachar({ tipo: 'quitar', productoId: linea.productoId })}
        >
            Quitar
        </button>
        </li>
    )
    }

    export default function PuntoDeVenta() {
    const { avisar } = useToast()
    const productos = useProductos()
    const categorias = useCategorias()
    const registrar = useRegistrarVenta()

    const [pedido, despachar] = useReducer(pedidoReducer, [])
    const [ultimaVenta, setUltimaVenta] = useState<Venta | null>(null)
    const [senalEnfocar, setSenalEnfocar] = useState(0)

    const catalogo = productos.data

    // Si el catálogo cambia (otro cajero vendió, se editó un precio…), el pedido se pone al día.
    useEffect(() => {
        if (catalogo) despachar({ tipo: 'sincronizar', productos: catalogo })
    }, [catalogo])

    function elegir(producto: Producto) {
        if (producto.stock < 1) {
        avisar(`«${producto.nombre}» está agotado`, 'error')
        return
        }
        if (!puedeAgregar(pedido, producto)) {
        avisar(`No hay más stock disponible de «${producto.nombre}»`, 'error')
        return
        }
        despachar({ tipo: 'agregar', producto })
        setUltimaVenta(null)
    }

    function confirmar() {
        if (pedido.length === 0) return
        registrar.mutate(aItemsVenta(pedido), {
        onSuccess: (venta) => {
            despachar({ tipo: 'vaciar' })
            setUltimaVenta(venta)
            avisar(`Venta #${venta.id} registrada`, 'ok')
            setSenalEnfocar((n) => n + 1)
        },
        onError: (err) => avisar(mensajeDeError(err), 'error'),
        })
    }

    const cantidadEnPedido = (id: number) => pedido.find((l) => l.productoId === id)?.cantidad ?? 0

    return (
        <>
        <div className="page-head">
            <h2>Punto de venta</h2>
            <p className="page-sub">Busca un producto, pulsa Enter para agregarlo y confirma la venta.</p>
        </div>
        <div className="ticket-divider" />

        {productos.error && (
            <p className={styles.error}>
            No se pudo cargar el catálogo: {productos.error.message}{' '}
            <Button variante="ghost" onClick={() => productos.refetch()}>Reintentar</Button>
            </p>
        )}

        <div className={styles.pagina}>
            {productos.isPending ? (
            <p>Cargando catálogo…</p>
            ) : (
            <BuscadorProductos
                productos={catalogo ?? []}
                categorias={categorias.data ?? []}
                cantidadEnPedido={cantidadEnPedido}
                onElegir={elegir}
                senalEnfocar={senalEnfocar}
            />
            )}

            <section className={styles.pedido} aria-labelledby="titulo-pedido">
            <h3 id="titulo-pedido">Pedido actual</h3>

            {pedido.length === 0 ? (
                <p className={styles.pedidoVacio}>Aún no has agregado productos.</p>
            ) : (
                <ul className={styles.lineas}>
                {pedido.map((linea) => (
                    <LineaPedidoFila key={linea.productoId} linea={linea} despachar={despachar} />
                ))}
                </ul>
            )}

            <div className={styles.total}>
                <span id="etiqueta-total">Total</span>
                <output aria-labelledby="etiqueta-total" className={styles.totalValor}>
                {formatoMoneda(totalPedido(pedido))}
                </output>
            </div>

            <div className={styles.acciones}>
                <Button onClick={confirmar} disabled={pedido.length === 0} cargando={registrar.isPending}>
                Confirmar venta
                </Button>
                {pedido.length > 0 && (
                <Button variante="ghost" onClick={() => despachar({ tipo: 'vaciar' })} disabled={registrar.isPending}>
                    Vaciar pedido
                </Button>
                )}
            </div>

            {ultimaVenta && (
                <p className={styles.ultima} role="status">
                Venta #{ultimaVenta.id} registrada · Total {formatoMoneda(ultimaVenta.total)}
                </p>
            )}
            </section>
        </div>
        </>
    )
    }