// Image compression utility
export const compressImage = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      // Set canvas dimensions
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      // Convert to base64 with compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
      
      resolve(compressedDataUrl)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

export const compressImages = async (files, maxWidth = 600, quality = 0.5) => {
  const compressedImages = []
  
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      try {
        const compressed = await compressImage(file, maxWidth, quality)
        compressedImages.push(compressed)
      } catch (error) {
        console.error('Error compressing image:', error)
        // Fallback to original file
        const reader = new FileReader()
        reader.onload = (e) => compressedImages.push(e.target.result)
        reader.readAsDataURL(file)
      }
    }
  }
  
  return compressedImages
}
