import { NavLink, Outlet } from 'react-router'
import { UserButton } from '@clerk/react'
import styles from './AppLayout.module.css'

// En los siguientes sprints se agregan aquí las demás secciones (según el rol).
const ENLACES = [{ to: '/', etiqueta: 'Inicio', end: true },
    ...(import.meta.env.DEV ? [{ to: '/muestrario', etiqueta: 'Muestrario', end: false }] : []),
]

export function AppLayout() {
    return (
        <div className={styles.shell}>
        <aside className={styles.sidebar}>
            <div className={styles.marca}>Restaurante</div>
            <div className={styles.marcaSub}>Panel de gestión</div>
            <nav aria-label="Principal">
            <ul className={styles.lista}>
                {ENLACES.map(({ to, etiqueta, end }) => (
                <li key={to}>
                    <NavLink
                    to={to}
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