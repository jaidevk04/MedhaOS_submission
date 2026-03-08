import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { Message } from '@/types';

interface MessageCardProps {
  message: Message;
  onClick: (message: Message) => void;
}

export function MessageCard({ message, onClick }: MessageCardProps) {
  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-all touch-target ${
        !message.read ? 'border-l-4 border-l-primary bg-primary/5' : ''
      } ${message.urgent ? 'ring-2 ring-urgent' : ''}`}
      onClick={() => onClick(message)}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <MessageSquare className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold truncate">{message.from}</p>
                {!message.read && (
                  <Badge variant="default" className="text-xs">
                    New
                  </Badge>
                )}
                {message.urgent && (
                  <Badge variant="urgent" className="text-xs">
                    Urgent
                  </Badge>
                )}
              </div>
              <p className="font-medium text-sm truncate">{message.subject}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{message.body}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{formatDateTime(message.timestamp)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
