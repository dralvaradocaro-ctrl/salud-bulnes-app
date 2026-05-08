import { useState } from 'react';
import { Trash2, Pencil, MoreVertical, RefreshCw } from 'lucide-react';
import { Button } from '@/medispense/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/medispense/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/medispense/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/medispense/components/ui/dialog";
import { supabase } from '@/medispense/integrations/supabase/client';
import { useToast } from '@/medispense/hooks/use-toast';

interface PrescriptionActionsProps {
  prescriptionId: string;
  prescriptionDate: string;
  onDeleted: () => void;
  onEdit: () => void;
  onRenewOnly?: () => void;
  onRenewAndEdit?: () => void;
  canDelete?: boolean;
}

export function PrescriptionActions({ 
  prescriptionId, 
  prescriptionDate,
  onDeleted,
  onEdit,
  onRenewOnly,
  onRenewAndEdit,
  canDelete = true,
}: PrescriptionActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error: itemsError } = await supabase
        .from('prescription_items')
        .delete()
        .eq('prescription_id', prescriptionId);

      if (itemsError) throw itemsError;

      const { error: prescriptionError } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', prescriptionId);

      if (prescriptionError) throw prescriptionError;

      toast({ title: 'Receta eliminada correctamente' });
      onDeleted();
    } catch (error) {
      console.error('Error deleting prescription:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo eliminar la receta', 
        variant: 'destructive' 
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onRenewOnly && (
            <DropdownMenuItem onClick={() => setShowRenewDialog(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Renovar receta
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar receta
          </DropdownMenuItem>
          {canDelete && (
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar receta
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Renew Dialog */}
      <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Renovar receta
            </DialogTitle>
            <DialogDescription>
              Elige cómo renovar la receta del {new Date(prescriptionDate).toLocaleDateString('es-CL')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              className="w-full justify-start h-auto py-3"
              onClick={() => {
                setShowRenewDialog(false);
                onRenewOnly?.();
              }}
            >
              <div className="text-left">
                <p className="font-semibold">Solo renovar</p>
                <p className="text-xs opacity-80 font-normal">Crea una nueva receta con los mismos medicamentos (válida por 1 año)</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => {
                setShowRenewDialog(false);
                onRenewAndEdit?.();
              }}
            >
              <div className="text-left">
                <p className="font-semibold">Renovar y editar</p>
                <p className="text-xs text-muted-foreground font-normal">Abre el editor con los medicamentos precargados para modificar</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar receta?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar la receta del {new Date(prescriptionDate).toLocaleDateString('es-CL')}. 
              Esta acción no se puede deshacer y se eliminarán todos los medicamentos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
