import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Asynchronously creates multiple role events in the database and logs the created roles.
 *
 * @return A promise that resolves when the role events are created and logged.
 * @throws If there is an error creating the role events.
 */
async function main() {

    try {
        const rolesToCreate = [
            { name: "admin" },
            { name: "participant" },
            { name: "gift" },
            { name: "superAdmin" }
        ];

        const existingRoles = await prisma.roleEvent.findMany({
            where: {
                name: {
                    in: rolesToCreate.map(role => role.name)
                }
            },
            select: { name: true }
        });

        const existingRoleNames = new Set(existingRoles.map(role => role.name));

        const newRoles = rolesToCreate.filter(role => !existingRoleNames.has(role.name));

        if (newRoles.length > 0) {
            await prisma.roleEvent.createMany({
                data: newRoles,
            });
            console.info(`Created roles: ${newRoles.map(r => r.name).join(", ")}`);
        } else {
            console.info("All roles already exist. No new roles created.");
        }

    } catch (error) {
        throw error
    }

}

try {
    await main();

} catch (error) {
    console.error("Une erreur c'est produit, les rôles sont peut être déjà crées");
    process.exit(1);
} finally {
    await prisma.$disconnect();
}
