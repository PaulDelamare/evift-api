// ! IMPORTS
import { errorServer } from "../lib/utils/errorServer";
import { PrismaClient } from "@prisma/client";
import { formatFileName } from "../lib/utils/formatFileName";

// ! CLASS
export class EventController {
    // ! Class Variable
    private readonly bdd: PrismaClient;

    // ! Constructor
    constructor() {
        // Bdd Instance
        this.bdd = new PrismaClient();
    }

    // ! Create new event
    /**
     * Create a new event in the database with the provided information.
     *
     * @param - The ID of the user creating the event.
     * @param - The event details including name, description, date, address, and optional image file.
     * @return - A promise that resolves to an object containing the status code and the ID of the newly created event.
     * @throws - If an error occurs during the event creation, an error server object is returned.
     */
    public async create(id: string, body: { name: string; description: string; date: Date; time: string; address: string; img?: File | undefined; }) {

        //? Try Create Event in Database
        try {

            // Define imgPath
            let imgPath = '';
            // If there are an image
            if (body.img) {

                // Format File Name
                imgPath = await formatFileName(body.img, 'uploads/public/events/');

                // Write File 
                await Bun.write(imgPath, body.img);
            }

            // Create Event
            const newEvent = await this.bdd.event.create({
                data: {
                    name: body.name,
                    description: body.description,
                    date: body.date,
                    time: body.time,
                    address: body.address,
                    img: imgPath,
                    user: { connect: { id } },
                },
            });

            // Get admin role
            const idAdminRole = await this.bdd.roleEvent.findFirst({ where: { name: "admin" } })

            // Create Participant
            await this.bdd.participant.create({
                data: {
                    id_event: newEvent.id,
                    id_user: id,
                    id_role: idAdminRole!.id,
                }
            })

            // Return Event id
            return {
                status: 201,
                data: newEvent.id,
            };

        }

        // ? If an error occur
        catch (error: unknown) {
            // Return Error Server
            return errorServer(
                error,
                "Une erreur s'est produite lors de la création de l'événement"
            );
        }
    }

    public async getAll(id: string) {
        try {
            const now = new Date();

            const events = await this.bdd.participant.findMany({
                where: {
                    event: {
                        date: {
                            gt: now
                        },
                    },
                    id_user: id

                },
                orderBy: {
                    event: {
                        date: 'asc'
                    }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstname: true,
                            lastname: true
                        }
                    },
                    event: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    firstname: true,
                                    lastname: true
                                }
                            }
                        }
                    }
                }
            });
            return {
                status: 200,
                data: events
            }
        } catch (error: unknown) {
            return errorServer(
                error,
                "Une erreur s'est produite lors de la récupération des événement"
            );
        }
    }

    /**
     * A function to get a single event by its ID.
     *
     * @param id - The ID of the event to retrieve.
     * @return An object containing the status code and the retrieved event data.
     */
    public async getOneEvent(id: string, id_event: string) {

        // - Try Request
        try {
            const event = await this.bdd.participant.findFirst({
                where: {
                    id_event: id_event,
                    id_user: id
                },
                include: {
                    event: true
                }
            });

            if (!event) {
                return {
                    status: 404,
                    data: "L'événement n'existe pas"
                }

            }
            return {
                status: 200,
                data: event
            }

        }

        // ? Catch Error 
        catch (error) {
            // Return Error Server
            return errorServer(error, "Une erreur s'est produite lors de la recherche de l'événement");
        }
    }
}
