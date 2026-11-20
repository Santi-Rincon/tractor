const LADO_MAX = 1280

// Reduce la foto de la cámara (3-5 MB) a un JPEG de ~150-300 KB.
export async function comprimir(archivo) {
  const url = URL.createObjectURL(archivo)
  try {
    const img = await new Promise((ok, mal) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = mal
      i.src = url
    })
    const escala = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight))
    const lienzo = document.createElement('canvas')
    lienzo.width = Math.round(img.naturalWidth * escala)
    lienzo.height = Math.round(img.naturalHeight * escala)
    lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height)
    return await new Promise((ok) => lienzo.toBlob(ok, 'image/jpeg', 0.72))
  } finally {
    URL.revokeObjectURL(url)
  }
}
