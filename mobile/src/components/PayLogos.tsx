import { Image } from 'react-native';

// Logos de paiement recréés en SVG (data-URI) — pas de fichier ni de dépendance externe.
// Rendu sur le web (déploiement Netlify) ; sur natif on basculera sur des PNG assets.

const WAVE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44">
  <rect width="44" height="44" rx="11" fill="#4DC3F0"/>
  <path d="M15 25 C7 22 6 14 11 12 C14.5 10.5 16.5 15 17.5 20 Z" fill="#0B0B0B"/>
  <path d="M22 6.5 C29.2 6.5 33.2 12 33.2 19 C33.2 24.5 34 30 31 34.8 C28.8 38 25 39.2 22 39.2 C19 39.2 15.2 38 13 34.8 C10 30 10.8 24.5 10.8 19 C10.8 12 14.8 6.5 22 6.5 Z" fill="#0B0B0B"/>
  <ellipse cx="22" cy="27.5" rx="7" ry="9" fill="#FFFFFF"/>
  <circle cx="19" cy="14.5" r="2.1" fill="#FFFFFF"/>
  <circle cx="25" cy="14.5" r="2.1" fill="#FFFFFF"/>
  <ellipse cx="22" cy="19.4" rx="3.6" ry="1.9" fill="#F26A1B"/>
  <ellipse cx="17" cy="38.4" rx="3.4" ry="2.1" fill="#F26A1B"/>
  <ellipse cx="27" cy="38.4" rx="3.4" ry="2.1" fill="#F26A1B"/>
</svg>`;

const ORANGE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44">
  <rect width="44" height="44" rx="11" fill="#F4F4F4"/>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="5.5">
    <path d="M13 31 L26 18" stroke="#0B0B0B"/>
    <path d="M19.5 18 L26 18 L26 24.5" stroke="#0B0B0B"/>
    <path d="M18 18 L31 31" stroke="#FF7900"/>
    <path d="M24.5 31 L31 31 L31 24.5" stroke="#FF7900"/>
  </g>
</svg>`;

const uri = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

export function WaveLogo({ size = 28 }: { size?: number }) {
  return <Image source={{ uri: uri(WAVE) }} style={{ width: size, height: size }} resizeMode="contain" />;
}
export function OrangeMoneyLogo({ size = 28 }: { size?: number }) {
  return <Image source={{ uri: uri(ORANGE) }} style={{ width: size, height: size }} resizeMode="contain" />;
}
