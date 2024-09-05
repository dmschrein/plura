"use client";

{
  /* Settings for User */
}
import {
  AuthUserWithAgencySigebarOptionsSubAccounts,
  UserWithPermissionsAndSubAccounts,
} from "@/lib/types";
import { useModal } from "@/providers/modal-provider";
import { SubAccount, User } from "@prisma/client";
import React, { useEffect, useState } from "react";
import { useToast } from "../ui/use-toast";
import { useRouter } from "next/navigation";
import {
  changeUserPermissions,
  getAuthUserDetails,
  getUserPermissions,
  saveActivityLogsNotification,
  updateUser,
} from "@/lib/queries";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import FileUpload from "../global/file-upload";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import Loading from "../global/loading";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { v4 } from "uuid";
import { permission } from "process";

type Props = {
  id: string | null;
  type: "agency" | "subaccount";
  userData?: Partial<User>;
  subAccounts?: SubAccount[];
};

const UserDetails = ({ id, type, subAccounts, userData }: Props) => {
  {
    /* useState hook is used to create and manage a piece of state within the component
    - declares a state variable 'subAccountPermissions` and corresponding setter function 
    'setSubAccountsPermissions'
    */
  }
  const [subAccountPermissions, setSubAccountsPermissions] =
    useState<UserWithPermissionsAndSubAccounts | null>(null);

  const { data, setClose } = useModal(); // Access data and setClose method from the modal provider
  const [roleState, setRoleState] = useState(""); // useState to manage the state of the user's role and loading status for permissions
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  // state to store authenticated user's detailed data
  const [authUserData, setAuthUserData] =
    useState<AuthUserWithAgencySigebarOptionsSubAccounts | null>(null);
  const { toast } = useToast(); // access the toast method to show notifications to the user
  const router = useRouter(); // access the router to navigate programmatically

  {
    /* useEffect hook in a React component to perform a side effect when the data variable changes */
  }
  useEffect(() => {
    if (data.user) {
      {
        /* Conditional check: ensured that the code inside the 'if' block will only run if 'data.user' is truthy (exists adn is not null or undefined) */
      }
      const fetchDetails = async () => {
        {
          /* if data.user is truthy, fetchDetails function is defined and immediatedly invoked. Function is asynchronous meaning it performs a network request or some other async operation */
        }
        const response = await getAuthUserDetails();
        {
          /* getAuthUserDetails - API call or a function that retrieves detailed information about the auth user */
        }
        if (response) setAuthUserData(response);
        {
          /* after 'getAuthUserDetails' resolves, the code checks if 'response' is truthy and if it is, 
          'setAuthUserData' function is called with the 'response'. State setter and updates the component state with the fetched user details */
        }
      };
      fetchDetails();
    }
  }, [data]);
  {
    /* dependency array configured to run whenever the data variable changes. The code inside the 'useEffect' will be executed whenever 'data' is updated */
  }
  {
    /* Effect of the update - Zod schema to validate the user in the form- re-render with new data, displaying or using the fetched user details */
  }
  const userDataSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    avatarUrl: z.string(),
    role: z.enum([
      "AGENCY_OWNER",
      "AGENCY_ADMIN",
      "SUBACCOUNT_USER",
      "SUBACCOUNT_GUEST",
    ]),
  });

  // useForm hook to manage form state and validation using react-hook-form
  // The resolver option integrates Zod schema validation into the form
  const form = useForm<z.infer<typeof userDataSchema>>({
    resolver: zodResolver(userDataSchema),
    mode: "onChange", // Validation is triggered on each change
    defaultValues: {
      // Set the form's default values based on userData or data.user
      /* If userData is provided (i.e., it is truthy), the expression will use userData.name as the default value. 
      If userData is not provided (i.e., it is falsy, such as null or undefined), the expression will fall back to 
      data?.user?.name. The ?. (optional chaining) operator is used to safely access data.user.name, ensuring that 
      the code doesn't throw an error if data or data.user is null or undefined.*/
      name: userData ? userData.name : data?.user?.name,
      email: userData ? userData.email : data?.user?.email,
      avatarUrl: userData ? userData.avatarUrl : data?.user?.avatarUrl,
      role: userData ? userData.role : data?.user?.role,
    },
  });

  // used to fetch and set user permissions when certain conditions are met
  useEffect(() => {
    // runs the enclosed code whenever the data or form dependencies change
    if (!data.user) return;
    const getPermissions = async () => {
      // defines an async function to get permissions that will be used to fetch user permissions
      if (!data.user) return;
      const permission = await getUserPermissions(data.user.id); // fetches the permissions for the user by calling the getUserPermissions function with data.user.id as an argument.
      setSubAccountsPermissions(permission); // updates the component's state with the fetched permissions
    };
    getPermissions(); // invokes the 'getPermissions' function to trigger the process of fetching and setting the user permissions as soon as the effect runs
  }, [data, form]);

  useEffect(() => {
    if (data.user) {
      form.reset(data.user);
    }
    if (userData) {
      form.reset(userData);
    }
  }, [userData, data]);

  const onChangePermission = async (
    subAccountId: string,
    val: boolean,
    permissionsId: string | undefined
  ) => {
    if (!data.user?.email) return;
    setLoadingPermissions(true);
    const response = await changeUserPermissions(
      permissionsId ? permissionsId : v4(),
      data.user.email,
      subAccountId,
      val
    );
    if (type === "agency") {
      await saveActivityLogsNotification({
        agencyId: authUserData?.Agency?.id,
        description: `Gave ${userData?.name} access to | ${
          subAccountPermissions?.Permissions.find(
            (p) => p.subAccountId === subAccountId
          )?.SubAccount.name
        } `,
        subaccountId: subAccountPermissions?.Permissions.find(
          (p) => p.subAccountId === subAccountId
        )?.SubAccount.id,
      });
    }
    if (response) {
      toast({
        title: "Success",
        description: "The request was successfull",
      });
      if (subAccountPermissions) {
        subAccountPermissions.Permissions.find((perm) => {
          if (perm.subAccountId === subAccountId) {
            return { ...perm, access: !perm.access };
          }
          return perm;
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Could not update permissions",
      });
    }
    router.refresh();
    setLoadingPermissions(false);
  };

  // saving user information
  const onSubmit = async (values: z.infer<typeof userDataSchema>) => {
    if (!id) return;
    if (userData || data?.user) {
      const updatedUser = await updateUser(values);
      authUserData?.Agency?.SubAccount.filter((subacc) =>
        authUserData.Permissions.find(
          (p) => p.subAccountId === subacc.id && p.access
        )
      ).forEach(async (subaccount) => {
        await saveActivityLogsNotification({
          agencyId: undefined,
          description: `Updated ${userData?.name} information`,
          subaccountId: subaccount.id,
        });
      });

      if (updatedUser) {
        toast({
          title: "Success",
          description: "Update User Information",
        });
        setClose();
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Oppse!",
          description: "Could not update user information",
        });
      }
    } else {
      console.log("Error could not submit");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Details</CardTitle>
        <CardDescription>Add or update your information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField //connects the ind form fields to 'react-hook-form' by using the controller - ensures that the form fields are controlled and validated according to the form state
              disabled={form.formState.isSubmitting}
              control={form.control} // passes the 'control' object from 'react-hook-form' to manage the field's value and validation
              name="avatarUrl" // specifies the field name for 'avatarUrl'
              render={(
                { field } // render prop recieves an object containing the 'field' property. This field object incldues values like value and 'onChange' that are needed to control the form element
              ) => (
                <FormItem>
                  <FormLabel>Profile picture</FormLabel>
                  <FormControl>
                    <FileUpload
                      apiEndpoint="avatar" // endpoint for file upload
                      value={field.value} // current value of the file input
                      onChange={field.onChange} // ensures that changes to the file input are properly tracked by the form state
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>User full name</FormLabel>
                  <FormControl>
                    <Input required placeholder="Full Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      readOnly={
                        userData?.role === "AGENCY_OWNER" ||
                        form.formState.isSubmitting
                      }
                      placeholder="Email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={form.formState.isSubmitting}
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>User Role</FormLabel>
                  {/* Shad cn component */}
                  <Select
                    disabled={field.value === "AGENCY_OWNER"}
                    onValueChange={(value) => {
                      if (
                        value === "SUBACCOUNT_USER" ||
                        value === "SUBACCOUNT_GUEST"
                      ) {
                        setRoleState(
                          "You need to have subaccounts to assign Subaccount access to team members."
                        );
                      } else {
                        setRoleState("");
                      }
                      field.onChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user role..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AGENCY_ADMING">
                        Agency Admin
                      </SelectItem>
                      {(data?.user?.role === "AGENCY_OWNER" ||
                        userData?.role === "AGENCY_OWNER") && (
                        <SelectItem value="AGENCY_OWNER">
                          Agency Owner
                        </SelectItem>
                      )}
                      <SelectItem value="SUBACCOUNT_USER">
                        Sub Account User
                      </SelectItem>
                      <SelectItem value="SUBACCOUNT_GUEST">
                        Sub Account Guest
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground">{roleState}</p>
                </FormItem>
              )}
            />

            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? <Loading /> : "Save User Details"}
            </Button>
            {authUserData?.role === "AGENCY_OWNER" && (
              <div>
                <Separator className="my-4" />
                <FormLabel>User Permissions</FormLabel>
                <FormDescription className="mb-4">
                  You can give Sub Account access to team member by turning on
                  access control for each Sub Account. This is only visible to
                  agency owners
                </FormDescription>
                <div className="flex flex-col gap-4">
                  {subAccounts?.map((subAccount) => {
                    const subAccountPermissionsDetails =
                      subAccountPermissions?.Permissions.find(
                        (p) => p.subAccountId === subAccount.id
                      );
                    return (
                      <div
                        key={subAccount.id}
                        className="flex flex-col items-center
                        justify-between rounded-lg border p-4"
                      >
                        <div>
                          <p>{subAccount.name}</p>
                        </div>
                        <Switch
                          disabled={loadingPermissions}
                          checked={subAccountPermissionsDetails?.access}
                          onCheckedChange={(permissiong) => {
                            onChangePermission;
                          }}
                        ></Switch>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default UserDetails;
