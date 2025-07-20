import { Friends } from "@prisma/client";
import { BaseService } from "../base.services";
import { throwError } from "../../lib/utils/errorHandler/errorHandler";

/**
 * Service class for Friend operations
 * @extends BaseService
 */
export class FriendsServices extends BaseService {

     private userSelect = {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
     } as const;

     /**
      * Retrieves all friends associated with the given user ID.
      *
      * This method queries the database for all friend relationships where the specified user
      * is either `user1` or `user2`. It selects relevant fields for each friend relationship,
      * including user details based on the `userSelect` configuration. The resulting array
      * is then transformed using the `transformFriendsArray` method before being returned.
      *
      * @param userId - The unique identifier of the user whose friends are to be retrieved.
      * @returns A promise that resolves to an array of transformed friend objects.
      */
     public async findAll(userId: string) {

          const friends = await this.db.friends.findMany({
               where: {
                    OR: [
                         { user1Id: userId },
                         { user2Id: userId },
                    ],
               },
               select: {
                    id: true,
                    created_at: true,
                    user1Id: true,
                    user2Id: true,
                    user: { select: this.userSelect },
                    user2: { select: this.userSelect },
               },
          });

          return await this.transformFriendsArray(friends, userId);
     }


     /**
      * Transforms an array of friend relationships into a simplified array of friend objects
      * relative to the provided user ID. For each friend relationship, it determines which
      * user is the friend (not the current user) and returns an object containing the friendship
      * ID, creation date, friend's user ID, and the friend's user object.
      *
      * @param friends - An array of friend relationship objects, each containing user and user2 details.
      * @param userId - The ID of the current user for whom the friend list is being transformed.
      * @returns An array of objects representing the user's friends with relevant details.
      */
     private async transformFriendsArray(
          friends: Array<Friends & { user: any; user2: any }>,
          userId: string
     ) {
          return friends.map(friend => {
               if (friend.user1Id === userId) {
                    return {
                         id: friend.id,
                         createdAt: friend.created_at,
                         userId: friend.user2.id,
                         user: friend.user2
                    };
               } else if (friend.user2Id === userId) {
                    return {
                         id: friend.id,
                         createdAt: friend.created_at,
                         userId: friend.user.id,
                         user: friend.user
                    };
               }
          });
     }

     /**
      * Checks if two users are already friends in the database.
      *
      * @param userId - The ID of the first user.
      * @param id - The ID of the second user to check friendship with.
      * @param checkError - If true, throws an error if the users are already friends. Defaults to true.
      * @throws Throws a 400 error if the users are already friends and `checkError` is true.
      * @returns Resolves if the users are not friends or if `checkError` is false.
      */
     public async checkAlreadyFriends(userId: string, id: string, checkError = true) {
          const friend = await this.db.friends.findFirst({
               where: {
                    OR: [
                         {
                              user1Id: userId,
                              user2Id: id,
                         },
                         {
                              user1Id: id,
                              user2Id: userId,
                         },
                    ],
               },
          });

          if (friend && checkError) {
               throw throwError(400, "Vous êtes déjà amis avec cet utilisateur");
          }

          return friend;
     }

     /**
      * Adds a new friend relationship between two users.
      *
      * @param userId - The ID of the first user (the one initiating the friend request).
      * @param id - The ID of the second user (the one being added as a friend).
      * @returns A promise that resolves when the friend relationship has been created.
      */
     public async addFriends(userId: string, id: string) {
          await this.db.friends.create({
               data: {
                    user1Id: userId,
                    user2Id: id,
               },
          });
     }

     /**
      * Deletes a friendship between two users.
      *
      * Searches for a friendship record between the given `userId` and `id` (regardless of order).
      * If the friendship exists, deletes it from the database.
      * Throws a 404 error if the friendship is not found.
      *
      * @param userId - The ID of the first user.
      * @param id - The ID of the second user.
      * @throws {Error} Throws a 404 error if the friendship is not found.
      */
     public async deleteFriends(userId: string, id: string) {
          const friend = await this.db.friends.findFirst({
               where: {
                    OR: [
                         {
                              user1Id: userId,
                              user2Id: id,
                         },
                         {
                              user1Id: id,
                              user2Id: userId,
                         },
                    ],
               },
          });

          if (!friend) {
               throw throwError(404, "Amitié non trouvée");
          }

          await this.db.friends.delete({
               where: { id: friend.id },
          });
     }
}

