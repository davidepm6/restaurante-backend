from typing import Annotated

from pydantic import StringConstraints

# Se recortan los espacios de los extremos y se exige al menos un carácter.
NombreTexto = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
DescripcionTexto = Annotated[str, StringConstraints(strip_whitespace=True, max_length=255)]