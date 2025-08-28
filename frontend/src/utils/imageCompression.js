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

export const compressImages = async (files, maxWidth = 400, quality = 0.3) => {
  const compressedImages = []
  
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      try {
        let compressed = await compressImage(file, maxWidth, quality)
        
        // Check if the compressed image is still too large (> 500KB)
        const base64Size = compressed.length * 0.75 // Approximate size in bytes
        if (base64Size > 500 * 1024) {
          console.log('Image still too large, compressing further...')
          // Try even more aggressive compression
          compressed = await compressImage(file, 300, 0.2)
        }
        
        // Final check - if still too large, compress even more
        const finalSize = compressed.length * 0.75
        if (finalSize > 500 * 1024) {
          console.log('Image still too large, using maximum compression...')
          compressed = await compressImage(file, 250, 0.15)
        }
        
        compressedImages.push(compressed)
        console.log(`Compressed image: ${Math.round((compressed.length * 0.75) / 1024)}KB`)
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
