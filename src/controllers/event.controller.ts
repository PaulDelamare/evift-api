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
     * Create new event
     *
     * @param id - The ID of the user.
     * @return A promise that resolves to an object with the status code and the list of friends.
     * If an error occurs, it returns an error server object.
     */
    public async create(id: string, body: { name: string; description: string; date: Date; address: string; img?: File | undefined; }) {

        //? Try Create User in Database
        try {

            // Define imgPath
            let imgPath = '';
            // If there are an image
            if (body.img) {

                // Format File Name
                imgPath = await formatFileName(body.img, './uploads/events/');

                // Write File 
                await Bun.write(imgPath, body.img);
            }

            // Create Event
            const newEvent = await this.bdd.event.create({
                data: {
                    name: body.name,
                    description: body.description,
                    date: body.date,
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
                    id_event:  newEvent.id,
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
                "Une erreur s'est produite lors de l'événement"
            );
        }
    }
}
