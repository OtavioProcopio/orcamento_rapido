export const MAX_LOGO_SIZE_BYTES = 1_000_000;

// SVG é seguro aqui porque a logo só é exibida via <img src="data:...">:
// diferente de <object>/<iframe>/navegação direta, <img> nunca executa
// <script> embutido num SVG, então não abre uma via de XSS.
const ALLOWED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

export const validateLogoFile = (file: File): string | null => {
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return "Formato não suportado. Envie PNG, JPG, WebP ou SVG.";
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return "Arquivo muito grande. O tamanho máximo é 1MB.";
  }
  return null;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Falha ao ler arquivo."));
    reader.readAsDataURL(file);
  });
};
