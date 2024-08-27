import { getAuthUserDetails, verifyAndAcceptInvitation } from "@/lib/queries"; // custom queries for database interactions
import { currentUser } from "@clerk/nextjs"; // Clerk authentication for current user details
import { verify } from "crypto"; // Node.js module for cryptographic operations
import { redirect } from "next/navigation"; // Next.js function for client-side redirection
import { Plan } from "@prisma/client"; // Importing Plan type from Prisma schema
import React from "react";
import { current } from "tailwindcss/colors";
import AgencyDetails from "@/components/forms/agency-details";

// Async function component that handles page logic
const Page = async ({
  searchParams,
}: {
  searchParams: { plan: Plan; state: string; code: string };
}) => {
  // handle users with invitation acceptance and retrive the associated agency ID
  const agencyId = await verifyAndAcceptInvitation();
  console.log(agencyId);
  // before displaying Agency content we have to get users details to check their access and account details (call server for info)
  // Retrieve authenticated user's details, including their role and account information
  const user = await getAuthUserDetails();
  // If the user is associated with an agency, check where to redirect the user
  if (agencyId) {
    // Check the user's role to determine where they should be redirected
    if (user?.role === "SUBACCOUNT_GUEST" || user?.role === "SUBACCOUNT_USER") {
      // redirect subaccount users to the subaccount page
      return redirect("/subaccount");
    } else if (user?.role === "AGENCY_OWNER" || user?.role === "AGENCY_ADMIN") {
      // if the user is an agency owner or admin, handle redirection based on query parameters

      // if a pricing plan is selected, redirect to the billing page with the selected plan
      if (searchParams.plan) {
        return redirect(
          `/agency/${agencyId}/billing?plan=${searchParams.plan}`
        );
      }
      // if a state is provided in the query parameters, process the state and agency ID
      // state property allows redirect to Stripe
      if (searchParams.state) {
        const statePath = searchParams.state.split("___")[0]; // Extract the state path
        const stateAgencyId = searchParams.state.split("___")[1]; // Extract the state agency ID

        // if no state agency ID is found, return an unauthorized message
        if (!stateAgencyId) return <div>Not authorized</div>;
        return redirect(
          `/agency/${stateAgencyId}/${statePath}?code=${searchParams.code}`
        ); // confirm code with stripe
        // agency id exists but redirect them to the agency
      } else return redirect(`/agency/${agencyId}`);
    } else {
      return <div>Not authorized</div>;
    }
  }

  // no agency, no subaccount, allow them to create their account
  const authUser = await currentUser()
  return (
    <div className="flex justify-center items-center mt-4">
        <div className="max-w-[850px] border-[1px] p-4 rounded-xl">
            <h1 className="text-4xl">Create an Agency</h1>
            <AgencyDetails
            data={{ companyEmail: authUser?.emailAddresses[0].emailAddress }}
            />
        </div>

    </div>
  )
};

export default Page;
