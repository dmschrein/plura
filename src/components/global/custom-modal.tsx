import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { Dialog } from "@tremor/react";
import React from "react";
import { DialogHeader } from "../ui/dialog";
import { useModal } from "@/providers/modal-provider";

type Props = {
  title: string;
  subheading: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

const CustomModal = ({ children, defaultOpen = false, subheading, title }: Props) => {
  const { isOpen, setClose } = useModal();
  return (
    <Dialog 
      open={isOpen !== undefined ? isOpen : defaultOpen}
      onOpenChange={setClose}
      >
      <DialogContent className="overflow-scroll md:max-h-[700px] md:h-fit h-screen bg-card">
        <DialogHeader className="pt-8 text-left">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription>{subheading}</DialogDescription>
          {children}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default CustomModal;
