from app.database import SessionLocal, Base, engine
from app import models
from app.models.usuario import Usuario, RolUsuario
from app.security.hashing import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

email = input("Email: ")
nombre = input("Nombre: ")
password = input("Contraseña: ")

print("Roles disponibles: 1) ADMINISTRADOR  2) EMPLEADO")
opcion = input("Selecciona el rol (1 o 2): ").strip()
rol = RolUsuario.ADMINISTRADOR if opcion == "1" else RolUsuario.EMPLEADO

if db.query(Usuario).filter(Usuario.email == email).first():
    print("Ya existe un usuario con ese email.")
else:
    nuevo_usuario = Usuario(
        nombre=nombre,
        email=email,
        password_hash=hash_password(password),
        rol=rol,
        activo=True
    )
    db.add(nuevo_usuario)
    db.commit()
    print(f"Usuario '{email}' creado correctamente con rol {rol.value}.")

db.close()