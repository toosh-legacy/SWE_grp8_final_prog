import { MAX_IMAGE_DATA_URL_LENGTH } from "./constants";

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read file"));
        return;
      }
      if (result.length > MAX_IMAGE_DATA_URL_LENGTH) {
        reject(new Error("Image is too large. Try a smaller photo."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
