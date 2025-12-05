// src/utils/confirmToast.js
import { toast } from "sonner";

/**
 * Muestra un toast con botones "Cancelar" y "Confirmar".
 * 
 * @param {string} message - Texto a mostrar
 * @param {object} options - { actionText: string }
 * @returns {Promise<boolean>}
 */
export function confirmToast(message, options = {}) {
  return new Promise((resolve) => {
    const { actionText = "Confirmar" } = options;

    toast(message, {
      duration: Infinity,
      important: true,
      style: { display: "flex", flexDirection: "column", gap: "8px" },
      action: {
        label: actionText,
        onClick: () => resolve(true),
      },
      cancel: {
        label: "Cancelar",
        onClick: () => resolve(false),
      },
    });
  });
}
