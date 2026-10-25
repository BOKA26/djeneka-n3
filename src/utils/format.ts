/**
 * Utility functions for formatting currencies, dates, and validation
 */

// Formats number into French FCFA format with space separators: e.g. 35 000 FCFA
export function formatFCFA(amount: number): string {
  if (isNaN(amount)) return '0 FCFA';
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
}

// Validates Ivorian phone numbers (standard 10 digits or with +225)
// Example valid: 0778030375, 0512345678, +225 07 78 03 03 75
export function validateIvorianPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/[\s\+\-()]/g, '');
  if (digitsOnly.startsWith('225') && digitsOnly.length === 13) {
    return true;
  }
  return digitsOnly.length === 10;
}

// Clean phone for tel: links
export function cleanPhoneForTel(phone: string): string {
  return phone.replace(/[\s()]/g, '');
}

// Format readable date
export function formatDateFR(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
