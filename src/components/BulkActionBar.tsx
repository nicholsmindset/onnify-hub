import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
}

export function BulkActionBar({ selectedCount, actions, onClear }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-background border shadow-lg rounded-full px-4 py-2">
      <span className="text-sm font-medium text-muted-foreground mr-2">
        {selectedCount} selected
      </span>
      {actions.map((action, i) => (
        <Button
          key={i}
          variant={action.variant ?? 'outline'}
          size="sm"
          onClick={action.onClick}
          className="rounded-full"
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
      <Button variant="ghost" size="icon" onClick={onClear} className="rounded-full h-8 w-8 ml-1">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
