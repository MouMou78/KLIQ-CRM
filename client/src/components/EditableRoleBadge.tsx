import { useState } from "react";
import { RoleBadge, type BuyingRole } from "./RoleBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";

interface EditableRoleBadgeProps {
  personId: string;
  role: BuyingRole | null;
}

export function EditableRoleBadge({ personId, role }: EditableRoleBadgeProps) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  
  const updateRoleMutation = trpc.people.updateRole.useMutation({
    onSuccess: () => {
      // Invalidate people list to refresh the UI
      utils.people.list.invalidate();
      setOpen(false);
    },
  });

  const handleRoleChange = (newRole: string) => {
    updateRoleMutation.mutate({
      personId,
      buyingRole: newRole as BuyingRole,
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">
          <RoleBadge role={role} />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2">
        <Select value={role || ""} onValueChange={handleRoleChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Decision Maker">Decision Maker</SelectItem>
            <SelectItem value="Champion">Champion</SelectItem>
            <SelectItem value="Influencer">Influencer</SelectItem>
            <SelectItem value="User">User</SelectItem>
            <SelectItem value="Blocker">Blocker</SelectItem>
          </SelectContent>
        </Select>
      </PopoverContent>
    </Popover>
  );
}
