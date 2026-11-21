/** Rango «desde–hasta» (contando desde 1) de los resultados de una página; ceros si no hay resultados. */
export function rangoMostrado(pagina: number, tamanio: number, total: number): { desde: number; hasta: number } {
  const desde = (pagina - 1) * tamanio + 1
    if (total <= 0 || desde > total) return { desde: 0, hasta: 0 }
  return { desde, hasta: Math.min(pagina * tamanio, total) }
}