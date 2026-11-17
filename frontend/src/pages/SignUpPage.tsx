import { SignUp } from '@clerk/react'
import styles from './SignInPage.module.css'

export default function SignUpPage() {
    return (
        <div className={styles.pantalla}>
        <section className={styles.marca}>
            <h1>Restaurante</h1>
            <p>Completa tu registro para acceder al panel.</p>
        </section>
        <section className={styles.formulario}>
            <SignUp />
        </section>
        </div>
    )
}