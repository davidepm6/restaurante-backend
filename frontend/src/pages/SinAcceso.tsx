import { Link } from 'react-router'

export default function SinAcceso() {
    return (
        <div className="page-head" role="alert">
        <h2>Sin acceso</h2>
        <p className="page-sub">Tu rol no permite ver esta sección.</p>
        <p style={{ marginTop: '1rem' }}>
            <Link to="/">Volver al inicio</Link>
        </p>
        </div>
    )
}