/**
 * Formatte une date en une chaîne de caractères.
 *
 * Prend une date en paramètre (peut être un objet Date, un timestamp, ou un string
 * représentant une date) et renvoie une chaîne de caractères formatée comme suit :
 * "jj/mm/aaaa - hhmm".
 *
 * @param date - La date à formater.
 * @return La date formatée.
 */
export const formatDate = (date: string | Date) => {
     date = new Date(date);
     const day = String(date.getDate()).padStart(2, '0');
     const month = String(date.getMonth() + 1).padStart(2, '0');
     const year = date.getFullYear();
     const hours = String(date.getHours()).padStart(2, '0');
     const minutes = String(date.getMinutes()).padStart(2, '0');

     return `${day}/${month}/${year}-${hours}h${minutes}`;
}
