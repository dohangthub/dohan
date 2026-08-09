import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// Ouvre la galerie, redimensionne (max 1080px) + compresse -> data URL base64 léger (ou null).
// Évite la limite de 6 Mo des fonctions Netlify (les photos de tel sont trop lourdes brutes).
export async function pickImageDataUrl(): Promise<string | null> {
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  });
  if (r.canceled || !r.assets?.[0]?.uri) return null;
  try {
    const m = await ImageManipulator.manipulateAsync(
      r.assets[0].uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    if (m.base64) return `data:image/jpeg;base64,${m.base64}`;
  } catch {}
  // Repli : base64 direct si dispo
  const b64 = r.assets[0].base64;
  return b64 ? `data:image/jpeg;base64,${b64}` : null;
}
