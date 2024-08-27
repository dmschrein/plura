"use client";
import React, { useEffect, useState } from "react";
import { Agency } from "@prisma/client";
import { useForm } from "react-hook-form";
import { useToast } from "../ui/use-toast";
import { useRouter } from "next/navigation";
import { AlertDialog } from "@radix-ui/react-alert-dialog";
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'

import * as z from "zod";
import FileUpload from "../global/file-upload";

type Props = {
  data?: Partial<Agency>;
};

const FormSchema = z.object({
  name: z.string().min(2, { message: "Agency name must be at least 2 chars." }),
  companyEmail: z.string().min(1),
  companyPhone: z.string().min(1),
  whiteLabel: z.boolean(),
  address: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  agencyLogo: z.string().min(1),
});

function AgencyDetails({ data }: Props) {
  const { toast } = useToast();
  const router = useRouter();

  const [deletingAgency, setDeletingAgency] = useState(false);
  const form = useForm<z.infer<typeof FormSchema>>({ // custom hook for managing forms with ease by defining and validating data structures
    mode: 'onChange',
    resolver: zodResolver(FormSchema), // zodResolver is used in conjunction with the 'react-hook-form' to validate form data against the 'FormSchema'
    defaultValues: {                   // The resolver ensures that the form data adheres to the structure and rules defined in the schema before it is processed or submitted
        name: data?.name,
        companyEmail: data?.companyEmail,
        companyPhone: data?.companyPhone,
        whiteLabel: data?.whiteLabel || false,
        address: data?.address,
        city: data?.city,
        zipCode: data?.zipCode,
        state: data?.state,
        country: data?.country,
        agencyLogo: data?.agencyLogo,
    }
  }); 
  const isLoading = form.formState.isSubmitting

  useEffect(() => {
    if (data) {
        form.reset(data)
    }
  }, [data])

  const handleSubmit = async () => {}

  return (
    <AlertDialog>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Agency Information</CardTitle>
          <CardDescription>
            Lets create an agency for you business. You can edit agency settings
            later from the agency settings tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                    >
                        <FormField 
                        disabled={isLoading}
                        control={form.control}
                        name="agencyLogo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Agency Logo</FormLabel>
                                <FormControl>
                                    <FileUpload
                                      apiEndpoint="agencyLogo"
                                      onChange={field.onChange}
                                      value={field.value}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        ></FormField>
                </form>
            </Form>
        </CardContent>
        </Card>
    </AlertDialog>
  );
}

export default AgencyDetails;
