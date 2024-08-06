// /utils/colorUtils.ts

function hashStringToNumber(str: string): number {
  // Check if the string is empty
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function numberToColorHsl(num: number): string {
  const hue = num % 360; // Limit the hue to a value between 0 and 360
  return `hsl(${hue}, 70%, 50%)`; // Use fixed saturation and lightness
}

export function generateGradient(firstName: string, lastName: string): string {
  const hash1 = hashStringToNumber(firstName);
  const hash2 = hashStringToNumber(lastName);
  const color1 = numberToColorHsl(hash1);
  const color2 = numberToColorHsl(hash2);
  return `linear-gradient(135deg, ${color1}, ${color2})`;
}

// Function to extract the main color from an image
export const getMainColor = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0, img.width, img.height);

      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height).data;
      if (!imageData) {
        reject('Failed to get image data');
        return;
      }

      let r = 0, g = 0, b = 0;
      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i+1];
        b += imageData[i+2];
      }
      r = Math.floor(r / (imageData.length / 4));
      g = Math.floor(g / (imageData.length / 4));
      b = Math.floor(b / (imageData.length / 4));

      resolve(`rgb(${r},${g},${b})`);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};