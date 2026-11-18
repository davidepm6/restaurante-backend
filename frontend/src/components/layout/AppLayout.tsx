import { NavLink, Outlet } from 'react-router'
import { UserButton } from '@clerk/react'
import { useMe } from '../../api/me'
import { rutasVisibles } from '../../auth/rutas'
import styles from './AppLayout.module.css'

export function AppLayout() {
    const { data: me } = useMe()
    const enlaces = rutasVisibles(me?.role)

    return (
        <div className={styles.shell}>
        <aside className={styles.sidebar}>
            <div className={styles.marca}>Restaurante</div>
            <div className={styles.marcaSub}>Panel de gestión</div>
            <nav aria-label="Principal">
            <ul className={styles.lista}>
                {enlaces.map(({ ruta, etiqueta, end }) => (
                <li key={ruta}>
                    <NavLink
                    to={ruta}
                    end={end}
                    className={({ isActive }) =>
                        isActive ? `${styles.enlace} ${styles.activo}` : styles.enlace
                    }
                    >
                    {etiqueta}
                    </NavLink>
                </li>
                ))}
            </ul>
            </nav>
        </aside>

        <div className={styles.contenido}>
            <header className={styles.barra}>
            <UserButton />
            </header>
            <main className={styles.principal}>
            <Outlet />
            </main>
        </div>
        </div>
    )
}