import { SignIn } from '@clerk/react'
import styles from "./SignInPage.module.css";

export default function SignInPage() {
    return (
        <div className={styles.pantalla}>
        <section className={styles.marca}>
            <h1>Restaurante</h1>
            <p>Panel interno de ventas, inventario y finanzas.</p>
        </section>
        <section className={styles.formulario}>
            <SignIn />
        </section>
        </div>
    )
}