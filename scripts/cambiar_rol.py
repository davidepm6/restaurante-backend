from app.database import SessionLocal
from app.models.usuario import Usuario, RolUsuario

db = SessionLocal()

email = input("Email del usuario a modificar: ")
usuario = db.query(Usuario).filter(Usuario.email == email).first()

if not usuario:
    print("No existe un usuario con ese email.")
else:
    print(f"Rol actual: {usuario.rol.value}")
    print("Roles disponibles: 1) ADMINISTRADOR  2) EMPLEADO")
    opcion = input("Nuevo rol (1 o 2): ").strip()
    usuario.rol = RolUsuario.ADMINISTRADOR if opcion == "1" else RolUsuario.EMPLEADO
    db.commit()
    print(f"Rol actualizado a {usuario.rol.value}.")

db.close()