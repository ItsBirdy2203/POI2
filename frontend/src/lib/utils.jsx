import { LANGUAGE_TO_FLAG } from "../constants";

export const capitialize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export function getLanguageFlag(language) {
  if (!language) return null;
  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];
  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="h-3 mr-1 inline-block"
      />
    );
  }
  return null;
}

// Codifica el texto a Base64
export function scrambleText(text) {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch { // Se quita la (e) que no se usa
    return text;
  }
}

// Decodifica el texto desde Base64
export function unscrambleText(scrambledText) {
  try {
    return decodeURIComponent(escape(atob(scrambledText)));
  } catch { // Se quita la (e) que no se usa
    return scrambledText;
  }
}