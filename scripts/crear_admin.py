from app.database import SessionLocal, Base, engine
from app import models  # fuerza el registro de todos los modelos en Base
from app.models.usuario import Usuario, RolUsuario
from app.security.hashing import hash_password

Base.metadata.create_all(bind=engine)  # asegura que todas las tablas existan, incluida 'usuarios'

db = SessionLocal()

email = input("Email del administrador: ")
nombre = input("Nombre: ")
password = input("Contraseña: ")

if db.query(Usuario).filter(Usuario.email == email).first():
    print("Ya existe un usuario con ese email.")
else:
    admin = Usuario(
        nombre=nombre,
        email=email,
        password_hash=hash_password(password),
        rol=RolUsuario.ADMINISTRADOR,
        activo=True
    )
    db.add(admin)
    db.commit()
    print(f"Administrador '{email}' creado correctamente.")

db.close()