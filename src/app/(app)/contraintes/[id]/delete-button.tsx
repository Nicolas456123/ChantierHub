"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteButtonProps {
  constraintId: string;
  constraintTitle: string;
}

export function DeleteButton({ constraintId, constraintTitle }: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/constraints/${constraintId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      toast.success("Contrainte supprimee");
      router.push("/contraintes");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression"
      );
      setIsDeleting(false);
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" />
        }
      >
        <Trash2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer la contrainte</DialogTitle>
          <DialogDescription>
            Etes-vous sur de vouloir supprimer la contrainte &quot;{constraintTitle}&quot; ?
            Cette action est irreversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={isDeleting} />}
          >
            Annuler
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
