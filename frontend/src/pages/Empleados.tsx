import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../api/client'
import {
    useCambiarEstado,
    useCambiarRol,
    useEmpleados,
    useInvitarEmpleado,
    useRevocarInvitacion,
    type Empleado,
    type Invitacion,
    type Rol,
    } from '../api/empleados'
    import { Button } from '../components/ui/Button'
    import { DataTable, type Columna } from '../components/ui/DataTable'
    import { Dialog } from '../components/ui/Dialog'
    import { Field } from '../components/ui/Field'
    import { useToast } from '../components/ui/toast-context'
    import styles from './Empleados.module.css'

    const ROLES: { valor: Rol; etiqueta: string }[] = [
    { valor: 'EMPLEADO', etiqueta: 'Empleado' },
    { valor: 'ADMINISTRADOR', etiqueta: 'Administrador' },
    ]

    function mensajeDeError(error: unknown): string {
    return error instanceof ApiError ? error.message : 'No se pudo completar la acción. Intenta de nuevo.'
    }

    export default function Empleados() {
    const { avisar } = useToast()
    const { data, error, isPending, refetch } = useEmpleados()
    const invitar = useInvitarEmpleado()
    const cambiarRol = useCambiarRol()
    const cambiarEstado = useCambiarEstado()
    const revocar = useRevocarInvitacion()

    const [email, setEmail] = useState('')
    const [rolInvitado, setRolInvitado] = useState<Rol>('EMPLEADO')
    const [pendiente, setPendiente] = useState<Empleado | null>(null)

    if (error instanceof ApiError && error.status === 403) {
        return (
        <div className="page-head">
            <h2>Empleados</h2>
            <p className="page-sub">No tienes permisos para ver esta sección.</p>
        </div>
        )
    }

    function enviarInvitacion(e: FormEvent) {
        e.preventDefault()
        const correo = email.trim()
        invitar.mutate(
        { email: correo, rol: rolInvitado },
        {
            onSuccess: () => {
            avisar(`Invitación enviada a ${correo}`, 'ok')
            setEmail('')
            },
            onError: (err) => avisar(mensajeDeError(err), 'error'),
        },
        )
    }

    function confirmarEstado() {
        if (!pendiente) return
        const nuevoEstado = !pendiente.activo
        cambiarEstado.mutate(
        { id: pendiente.id, activo: nuevoEstado },
        {
            onSuccess: () => avisar(nuevoEstado ? 'Cuenta reactivada' : 'Cuenta desactivada', 'ok'),
            onError: (err) => avisar(mensajeDeError(err), 'error'),
            onSettled: () => setPendiente(null),
        },
        )
    }

    const columnasUsuarios: Columna<Empleado>[] = [
        {
        clave: 'nombre',
        titulo: 'Nombre',
        celda: (u) => (
            <>
            {u.nombre}
            {u.es_actual && <span className={styles.yo}> (tú)</span>}
            </>
        ),
        },
        { clave: 'email', titulo: 'Correo', celda: (u) => u.email ?? '—' },
        {
        clave: 'rol',
        titulo: 'Rol',
        celda: (u) => (
            <select
            className={styles.selector}
            aria-label={`Rol de ${u.nombre}`}
            value={u.rol ?? ''}
            disabled={u.es_actual || cambiarRol.isPending}
            onChange={(e) =>
                cambiarRol.mutate(
                { id: u.id, rol: e.target.value as Rol },
                {
                    onSuccess: () => avisar('Rol actualizado. Se aplica en hasta un minuto.', 'ok'),
                    onError: (err) => avisar(mensajeDeError(err), 'error'),
                },
                )
            }
            >
            {u.rol === null && <option value="" disabled>Sin rol</option>}
            {ROLES.map((r) => (
                <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
            ))}
            </select>
        ),
        },
        {
        clave: 'estado',
        titulo: 'Estado',
        celda: (u) => <span className={u.activo ? styles.activo : styles.inactivo}>{u.activo ? 'Activo' : 'Desactivado'}</span>,
        },
        {
        clave: 'acciones',
        titulo: 'Acciones',
        alinear: 'derecha',
        celda: (u) =>
            u.es_actual ? null : (
            <Button variante="ghost" onClick={() => setPendiente(u)}>
                {u.activo ? 'Desactivar' : 'Reactivar'}
            </Button>
            ),
        },
    ]

    const columnasInvitaciones: Columna<Invitacion>[] = [
        { clave: 'email', titulo: 'Correo', celda: (i) => i.email },
        { clave: 'rol', titulo: 'Rol', celda: (i) => ROLES.find((r) => r.valor === i.rol)?.etiqueta ?? '—' },
        {
        clave: 'acciones',
        titulo: 'Acciones',
        alinear: 'derecha',
        celda: (i) => (
            <Button
            variante="ghost"
            onClick={() =>
                revocar.mutate(i.id, {
                onSuccess: () => avisar('Invitación revocada', 'ok'),
                onError: (err) => avisar(mensajeDeError(err), 'error'),
                })
            }
            >
            Revocar
            </Button>
        ),
        },
    ]

    return (
        <>
        <div className="page-head">
            <h2>Empleados</h2>
            <p className="page-sub">Invita personas, asigna roles y controla quién puede entrar.</p>
        </div>
        <div className="ticket-divider" />

        <form className={styles.formulario} onSubmit={enviarInvitacion}>
            <Field
            etiqueta="Correo del empleado"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            />
            <label className={styles.campoRol}>
            <span>Rol</span>
            <select className={styles.selector} value={rolInvitado} onChange={(e) => setRolInvitado(e.target.value as Rol)}>
                {ROLES.map((r) => (
                <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
                ))}
            </select>
            </label>
            <Button type="submit" cargando={invitar.isPending}>Enviar invitación</Button>
        </form>

        {error && !(error instanceof ApiError && error.status === 403) && (
            <p className={styles.error}>
            No se pudo cargar la lista: {error.message}{' '}
            <Button variante="ghost" onClick={() => refetch()}>Reintentar</Button>
            </p>
        )}

        <h3 className={styles.seccion}>Cuentas</h3>
        <DataTable columnas={columnasUsuarios} filas={data?.usuarios ?? []} claveFila={(u) => u.id} cargando={isPending} />

        <h3 className={styles.seccion}>Invitaciones pendientes</h3>
        <DataTable
            columnas={columnasInvitaciones}
            filas={data?.invitaciones ?? []}
            claveFila={(i) => i.id}
            cargando={isPending}
            vacio="No hay invitaciones pendientes."
        />

        <Dialog
            abierto={pendiente !== null}
            titulo={pendiente?.activo ? 'Desactivar cuenta' : 'Reactivar cuenta'}
            textoConfirmar={pendiente?.activo ? 'Desactivar' : 'Reactivar'}
            peligro={pendiente?.activo ?? false}
            cargando={cambiarEstado.isPending}
            onConfirmar={confirmarEstado}
            onCancelar={() => setPendiente(null)}
        >
            {pendiente?.activo
            ? `${pendiente.nombre} no podrá volver a iniciar sesión y se cerrarán sus sesiones activas.`
            : `${pendiente?.nombre ?? 'La persona'} podrá volver a iniciar sesión.`}
        </Dialog>
        </>
    )
}