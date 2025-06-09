import { formatDate } from "./formatDateError";
import { expect, describe, it } from 'bun:test'


describe('formatDate', () => {
     it('formats the date correctly', () => {
          const date = new Date('2024-11-05T11:01:00Z');
          const formattedDate = formatDate(date);
          expect(formattedDate).toBe('05/11/2024-11h01');
     });

     it('handles single digit day and month correctly', () => {
          const date = new Date('2024-01-05T01:01:00Z');
          const formattedDate = formatDate(date);
          expect(formattedDate).toBe('05/01/2024-01h01');
     });

     it('handles single digit hours and minutes correctly', () => {
          const date = new Date('2024-11-05T01:01:00Z');
          const formattedDate = formatDate(date);
          expect(formattedDate).toBe('05/11/2024-01h01');
     });
});
