"use server";

import { currentUser } from "@clerk/nextjs"; // Clerk's function to get the currently authenticated user
import { db } from "./db"; // Import the database instance for querying 
import { redirect } from "next/navigation"; //Next.js function to handle client-side redirects
import { User } from "@prisma/client"; // Importing the User type from Prisma schema
import { clerkClient } from "@clerk/nextjs/server"; // Server-side access to Clerk's API

// apis for backend access
// Function to get the authenticated user details from the database
export const getAuthUserDetails = async () => {
  const user = await currentUser(); // Get the current authenticated user
  if (!user) {
    return; // If no user is authenticated, return early
  }

  // Fetch the user data from the database, including associated agency and subaccount information
  const userData = await db.user.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress, // Query based on user's email address
    },
    include: {
      Agency: {
        include: {
          SidebarOption: true, // Include associated sidebar options
          SubAccount: {
            include: {
              SidebarOption: true, // Include sidebar options for subaccounts as well
            },
          },
        },
      },
      Permissions: true, // Include user's permissions
    },
  });
  return userData; // Return the retrieved user data
};

// Function to save activity logs and notifications in the database
export const saveActivityLogsNotification = async ({
  agencyId,
  description,
  subaccountId,
}: {
  agencyId?: string; // Optional agency ID
  description: string; // Description of the activity
  subaccountId?: string; // Optional subaccount ID
}) => {
  const authUser = await currentUser(); // Get the current authenticated user
  let userData;
  if (!authUser) {
    // If no authenticated user, find a user based on subaccount ID
    const response = await db.user.findFirst({
      where: {
        Agency: {
          SubAccount: {
            some: { id: subaccountId }, // Query by subaccount ID
          },
        },
      },
    });
    if (response) {
      userData = response; // Set user data if found
    }
  } else {
    // If authenticated user exits, find their details in the database
    userData = await db.user.findUnique({
      where: { email: authUser?.emailAddresses[0].emailAddress },
    });
  }
  if (!userData) {
    console.log("Could not find a user"); // Log if no user data is found
    return;
  }

  // sometimes notifications are assigned to subaccounts and in the subaccount we won't have access to agency id's
  // so we have to find agency id, if agency ID is not provided, find it based on the subaccount ID
  let foundAgencyId = agencyId;
  if (!foundAgencyId) {
    // checking if there's an agency id
    if (!subaccountId) {
      throw new Error(
        "You need to provide at least an agency Id or subaccount Id"
      );
    }
    const response = await db.subAccount.findUnique({
      where: { id: subaccountId }, // find subaccount by ID
    });
    if (response) foundAgencyId = response.agencyId; // set agency ID if found
  }
  // if there's a subaccount, connect the user, agency and subaccount
  if (subaccountId) {
    await db.notification.create({
      data: {
        notification: `${userData.name} | ${description}`, // Notification content
        User: {
          connect: {
            id: userData.id, // Connect the notification to the user
          },
        },
        Agency: {
          connect: {
            id: foundAgencyId, // Connect the notification to the agency
          },
        },
        SubAccount: {
          connect: { id: subaccountId }, // Connect the notification to the subaccount
        },
      },
    });
  } else {
    await db.notification.create({
      data: {
        notification: `${userData.name} | ${description}`, // Notification content
        User: {
          connect: {
            id: userData.id, // Connect the notification to the user
          },
        },
        Agency: {
          connect: {
            id: foundAgencyId, // Connect the notification to the agency
          },
        },
      },
    });
  }
};

// Function to  create a new team user in the database
export const createTeamUser = async (agencyId: string, user: User) => {
  if (user.role === "AGENCY_OWNER") return null; // Skip if the user is the agency owner
  const response = await db.user.create({ data: { ...user } }); // Create a new user record in the database
  return response; // Return the created user data
};

// Function to verify and accept a user invitation
export const verifyAndAcceptInvitation = async () => {
  const user = await currentUser(); // Get the current authenticated user
  if (!user) return redirect("/sign-in"); //Redirect to sign-in if no user is authenticated
  
  // Check if there's a pending invitation for the user
  const invitationExists = await db.invitation.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress, // Query by user's email address
      status: "PENDING", // Check if the invitation is still pending
    },
  });

  if (invitationExists) {
    // If an invitation exists, create a new team user
    const userDetails = await createTeamUser(invitationExists.agencyId, {
      email: invitationExists.email, // User's email
      agencyId: invitationExists.agencyId, // Associated agency ID
      avatarUrl: user.imageUrl, // User's avatar URL
      id: user.id, // User's ID
      name: `${user.firstName} ${user.lastName}`, // User's full name
      role: invitationExists.role, // User's role as specified in the invitation
      createdAt: new Date(), // Creation timestamp
      updatedAt: new Date(), // Update timestamp
    });

    // Save a log of the user's activity
    await saveActivityLogsNotification({
      agencyId: invitationExists?.agencyId,
      description: `Joined`, // Description of the activity
      subaccountId: undefined, // No subaccount ID in this case
    });
    if (userDetails) {
        // Update user's role in Clerk's private metadata
      await clerkClient.users.updateUserMetadata(user.id, {
        privateMetadata: {
          role: userDetails.role || "SUBACCOUNT_USER", // Default role if not specified
        },
      });
      // delete the invitation after it's been accepted
      await db.invitation.delete({
        where: {
          email: userDetails.email, // Delete by the user's email
        },
      });
      return userDetails.agencyId; // Return the agency ID associated with the invitation
    } else return null;
  } else {
    // If no invitation exists, check if the user is already associated with an agency
    const agency = await db.user.findUnique({
      where: {
        email: user.emailAddresses[0].emailAddress, // Query by user's email address
      },
    });
    return agency ? agency.agencyId : null; // Return the agency ID or null if not found
  }
};
