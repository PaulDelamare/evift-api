// tests/sendResponse.test.ts
import { describe, it, expect } from 'bun:test';
import { sendResponse } from './returnSuccess';

type CustomContext = {
     set: { status?: number | string | undefined };
};

describe('sendResponse', () => {
     it('should set the status and return an object with the message when payload is a string', () => {
          const ctx = { set: {} } as CustomContext;
          const statusCode = 200;
          const msg = 'Opération réussie';

          const result = sendResponse(ctx, statusCode, msg);

          expect(ctx.set.status).toBe(statusCode);
          expect(result).toEqual({ message: msg });
     });

     it('should override any existing status when payload is a string', () => {
          const ctx = { set: { status: 400 } } as CustomContext;
          const newStatus = 201;
          const msg = 'Créé';

          const result = sendResponse(ctx, newStatus, msg);

          expect(ctx.set.status).toBe(newStatus);
          expect(result).toEqual({ message: msg });
     });

     it('should set the status and return an object with data when payload is a primitive', () => {
          const ctx = { set: {} } as CustomContext;
          const statusCode = 200;
          const data = 123;

          const result = sendResponse(ctx, statusCode, data);

          expect(ctx.set.status).toBe(statusCode);
          expect(result).toEqual({ data });
     });

     it('should set the status and return an object with data when payload is an object', () => {
          const ctx = { set: {} } as CustomContext;
          const statusCode = 202;
          const data = { id: 1, name: 'Test' };

          const result = sendResponse(ctx, statusCode, data);

          expect(ctx.set.status).toBe(statusCode);
          expect(result).toEqual({ data });
     });
});
