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
        await prisma.roleEvent.createMany({
            data: [
                {
                    name: "admin",
                },
                {
                    name: "participant",
                },
                {
                    name: "gift",
                },
            ],
        })

        const roles = await prisma.roleEvent.findMany();
    } catch (error) {
        throw error
    }

}

try {
    await main();

} catch (error) {
    console.log("Une erreur c'est produit, les rôles sont peut être déjà crées");
    process.exit(1);
} finally {
    await prisma.$disconnect();
}
