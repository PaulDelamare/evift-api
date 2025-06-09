// ! IMPORTS
import type { Prisma } from '@prisma/client';
import { formatDate } from '../formatDateError/formatDateError';
import { log } from '../../../config/api-config';

// Types
type ErrorResponse = { status: number, error: { error: string } };
type PrismaErrorResult = { status: number, message: string };

// Log levels enum
export enum LogLevel {
     ERROR = 'ERROR',
     WARN = 'WARN'
}

// Constants
const LOG_COLORS = {

     // Red for errors
     [LogLevel.ERROR]: "\x1b[31m",

     // Yellow for warnings
     [LogLevel.WARN]: "\x1b[33m",
};
const COLOR_RESET = "\x1b[0m";

/**
 * Extracts meaningful error information from Prisma errors
 */
const getPrismaErrorMessage = (error: Prisma.PrismaClientKnownRequestError): PrismaErrorResult => {
     switch (error.code) {
          case 'P2002': {
               const field = error.meta?.target || 'inconnu';
               return { status: 400, message: `Erreur : le champ ${field} doit être unique. La valeur fournie est déjà utilisée.` };
          }
          case 'P2003':
               return { status: 400, message: "Erreur : violation de contrainte de clé étrangère. Veuillez vérifier les références." };
          case 'P2025':
               return { status: 404, message: "Erreur : Une opération a échoué car elle dépend d'un ou plusieurs enregistrements requis mais introuvables." };
          default:
               return { status: 500, message: "Erreur serveur : une erreur Prisma inconnue s'est produite." };
     }
};

/**
 * Generic logging function for different log levels
 */
interface LogContext {
     request: { method: string };
     path: string;
     error: (status: number, error: unknown) => ErrorResponse;
}

export const logMessage = async <T extends LogContext>(level: LogLevel, ctx: T, location = "", message?: string): Promise<void> => {
     const dateFormatted = formatDate(new Date());
     const logPrefix = `[${dateFormatted}] ${level} ${ctx.request.method}: ${ctx.path} ${location}`;
     const logContent = message ? `${logPrefix} | ${message}` : logPrefix;

     const logFn = level === LogLevel.ERROR ? console.error : console.warn;
     logFn(`${LOG_COLORS[level]}${logContent}${COLOR_RESET}`);

     if (level === LogLevel.ERROR) {
          log.error(ctx, logContent);
     } else {
          log.warn(ctx, logContent);
     }
};

/**
 * Log an error message
 */
export const logError = <T extends LogContext>(ctx: T, location = "", errorMessage?: string): Promise<void> =>
     logMessage(LogLevel.ERROR, ctx, location, errorMessage);

/**
 * Log a warning message
 */
export const logWarn = <T extends LogContext>(ctx: T, location = "", warningMessage?: string): Promise<void> =>
     logMessage(LogLevel.WARN, ctx, location, warningMessage);

/**
 * Throws an error with a status code and message
 */
export const throwError = (status: number, message: string): never => {
     throw { status, error: { error: message } };
};

/**
 * Formats validation errors into a consistent structure
 */
const formatValidationErrors = (error: { status: number, error: string }): ErrorResponse => ({
     status: error.status,
     error: { error: error.error }
});

/**
 * Centralized error handler for all types of errors
 */
export const handleError = (error: unknown): ErrorResponse => {

     // Handle Prisma errors
     if (typeof error === 'object' && error !== null && 'code' in error) {
          const prismaError = getPrismaErrorMessage(error as Prisma.PrismaClientKnownRequestError);

          return { status: prismaError.status, error: { error: prismaError.message } };
     }

     if (typeof error === 'object' && error !== null && 'status' in error) {

          const validationError = formatValidationErrors(error as { status: number, error: string });

          return { status: validationError.status, error: validationError.error };
     }

     if (error instanceof Error) {
          return { status: 500, error: { error: error.message } };
     }

     return { status: 500, error: { error: 'Erreur serveur inconnue' } };
};
