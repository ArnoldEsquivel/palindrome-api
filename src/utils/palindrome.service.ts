import { Injectable } from '@nestjs/common';

@Injectable()
export class PalindromeService {
    
  /**
   * Normaliza texto para evaluación de palíndromo:
   * - Convierte a minúsculas
   * - Remueve diacríticos
   * - Mantiene solo caracteres alfanuméricos [a-z0-9]
   */
  normalizeForPalindrome(text: string): string {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .normalize('NFD')                // Descompone caracteres con acentos
      .replace(/[\u0300-\u036f]/g, '') // Remueve marcas diacríticas
      .replace(/[^a-z0-9]/g, '');      // Solo alfanumérico
  }

  // Evalúa si un texto es palíndromo después de normalización
  isPalindrome(text: string): boolean {
    const normalized = this.normalizeForPalindrome(text);
    
    // Los palíndromos deben tener al menos 3 caracteres para aplicar descuento
    if (normalized.length < 3) return false;
    
    return normalized === normalized.split('').reverse().join('');
  }
}
