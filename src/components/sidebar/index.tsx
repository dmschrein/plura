import { getAuthUserDetails } from "@/lib/queries";
import React from "react";
import MenuOptions from "./menu-options";

type Props = {
  id: string;
  type: "agency" | "subaccount";
};

// If, when and how will the sidebar be rendered for the user based on user authentication details
const Sidebar = async ({ id, type }: Props) => {
  // Fetch authenticated user details
  const user = await getAuthUserDetails();
  // if no user is authenticated, do not render the sidebar
  if (!user) return null;

  // If the user is not associated with an agency, do not render the sidebar
  if (!user.Agency) return;

  // Get the details based on the type (either agency or subaccount)
  const details =
    type === "agency"
      ? user?.Agency
      : user?.Agency.SubAccount.find((subaccount) => subaccount.id === id);

  // Check if the agency is white-labeled
  const isWhiteLabelAgency = user.Agency.whiteLabel;
  // if no details are found, do not render the sidebar
  if (!details) return;

  // Set the sidebar logo, defaulting to the agency logo or a fallback logo
  let sideBarLogo = user.Agency.agencyLogo || "/assests/plura-logo";

  // If the agency is not white-labeled and the type is 'subaccount',
  // override the logo with the subaccount logo if available
  if (!isWhiteLabelAgency) {
    if (type === "subaccount") {
      sideBarLogo =
        user?.Agency.SubAccount.find((subaccount) => subaccount.id === id)
          ?.subAccountLogo || user.Agency.agencyLogo;
    }
  }

  // Set the sidebar options based on the type (either agency or subaccount)
  const sidebarOpt =
    type === "agency"
      ? user.Agency.SidebarOption || []
      : user.Agency.SubAccount.find((subaccount) => subaccount.id === id)
          ?.SidebarOption || [];
  // Filter subaccounts that the user has permission to access
  const subaccounts = user.Agency.SubAccount.filter((subaccount) =>
    user.Permissions.find(
      (permission) =>
        permission.subAccountId === subaccount.id && permission.access
    )
  );
  // Render the sidebar menu options
  return (
    <>
      <MenuOptions
        defaultOpen={true}
        details={details}
        id={id}
        sidebarLogo={sideBarLogo}
        sidebarOpt={sidebarOpt}
        subAccounts={subaccounts}
        user={user}
      />
      <MenuOptions
        details={details}
        id={id}
        sidebarLogo={sideBarLogo}
        sidebarOpt={sidebarOpt}
        subAccounts={subaccounts}
        user={user}
      />
    </>
  );
};

export default Sidebar;
