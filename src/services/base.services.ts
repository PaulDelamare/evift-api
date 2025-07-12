import { db as defaultDb } from "../../src/config/db-config";

/**
 * Classe de base pour tous les services
 * Gère automatiquement l'injection de dépendance
 */
export abstract class BaseService {
     constructor(protected db = defaultDb) { }
}