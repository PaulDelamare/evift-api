import { Friends } from "@prisma/client";
import { BaseService } from "../base.services";

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
}

