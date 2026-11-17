import { useUser } from '@clerk/react'
import { useMe } from '../api/me'
import styles from './Inicio.module.css'

export default function Inicio() {
    const { user } = useUser()
    const { data, error, isPending, refetch } = useMe()

    return (
        <>
        <div className="page-head">
            <h2>Hola{user?.firstName ? `, ${user.firstName}` : ''}</h2>
            <p className="page-sub">Esta pantalla confirma que tu sesión de Clerk es aceptada por la API.</p>
        </div>
        <div className="ticket-divider" />

        <section className={styles.tarjeta} aria-live="polite">
            <h3>Conexión con el servidor</h3>

            {isPending && <p>Conectando con el servidor…</p>}

            {error && (
            <>
                <p className={styles.error}>No se pudo verificar la sesión: {error.message}</p>
                <button className={styles.reintentar} onClick={() => refetch()}>
                Reintentar
                </button>
            </>
            )}

            {data && (
            <>
                <div className={styles.fila}>
                <span className={styles.etiqueta}>Estado</span>
                <span className={styles.ok}>Sesión verificada</span>
                </div>
                <div className={styles.fila}>
                <span className={styles.etiqueta}>ID de usuario</span>
                <span>{data.clerk_user_id}</span>
                </div>
                <div className={styles.fila}>
                <span className={styles.etiqueta}>Rol</span>
                <span>{data.role ?? 'Sin rol asignado'}</span>
                </div>
            </>
            )}
            {data && data.role === null && (
                <p className={styles.aviso} role="status">
                Tu cuenta aún no tiene un rol asignado. Pide a un administrador que te lo asigne y vuelve a iniciar sesión.
            </p>
        )}

        </section>
        </>
    )
}