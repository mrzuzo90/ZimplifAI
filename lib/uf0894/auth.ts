/**
 * NOTA TÉCNICA DE SEGURIDAD / ACCESS CONTROL:
 * La validación de acceso para el módulo formativo UF0894 se efectúa de manera
 * local en el navegador del cliente.
 *
 * El código de acceso ("ELEE0109") es una barrera casual / filtro pedagógico para
 * evitar el acceso involuntario de visitantes casuales o motores de búsqueda. NO ofrece
 * seguridad criptográfica real, ya que el código queda incluido en el bundle JavaScript
 * del cliente y resulta visible al inspeccionar las fuentes de la aplicación en las
 * herramientas de desarrollo del navegador.
 *
 * Por política de diseño de interfaz de usuario (UI), la contraseña NO debe mostrarse
 * en el placeholder ni en ningún texto visible para mantener la experiencia didáctica.
 *
 * La persistencia de sesión durante la pestaña se gestiona mediante sessionStorage,
 * guardando únicamente un indicador booleano de desbloqueo ("true"), sin almacenar
 * la contraseña en texto plano dentro del almacenamiento del navegador.
 */

export const UF0894_ACCESS_CODE = "ELEE0109";
export const UF0894_STORAGE_KEY = "uf0894_unlocked_v1";

/**
 * Valida si el código introducido por el usuario coincide con la clave esperada.
 * Normaliza espacios y mayúsculas para tolerar entradas casuales.
 */
export function verifyAccessCode(input: unknown): boolean {
  if (typeof input !== "string") return false;
  const clean = input.trim().toUpperCase();
  if (clean.length === 0) return false;
  return clean === UF0894_ACCESS_CODE;
}

/**
 * Comprueba si la sesión se encuentra desbloqueada en el sessionStorage del navegador.
 */
export function isAccessUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(UF0894_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Registra el estado desbloqueado en sessionStorage.
 * Cumple la directiva de seguridad de NO almacenar la contraseña como texto en el storage.
 */
export function setAccessUnlocked(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(UF0894_STORAGE_KEY, "true");
  } catch {
    // Silencioso ante restricciones de almacenamiento privado
  }
}

/**
 * Limpia la sesión de sessionStorage al bloquear o cerrar la sesión.
 */
export function clearAccessUnlocked(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(UF0894_STORAGE_KEY);
  } catch {
    // Silencioso ante restricciones de almacenamiento privado
  }
}
