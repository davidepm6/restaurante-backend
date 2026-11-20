from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.tipos import DescripcionTexto, NombreTexto


class CategoriaBase(BaseModel):
    nombre: NombreTexto
    descripcion: Optional[DescripcionTexto] = None


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaUpdate(BaseModel):
    nombre: Optional[NombreTexto] = None
    descripcion: Optional[DescripcionTexto] = None


class CategoriaOut(CategoriaBase):
    id: int
    creado_en: datetime

    model_config = ConfigDict(from_attributes=True)