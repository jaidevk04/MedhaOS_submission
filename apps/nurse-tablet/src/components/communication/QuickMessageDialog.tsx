import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, AlertCircle } from 'lucide-react';

interface QuickMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (message: { to: string; subject: string; body: string; urgent: boolean }) => void;
}

const quickTemplates = [
  { subject: 'Patient Assessment Needed', body: 'Please assess patient when available.' },
  { subject: 'Medication Question', body: 'I have a question about the prescribed medication.' },
  { subject: 'Lab Results Review', body: 'Please review recent lab results.' },
  { subject: 'Discharge Planning', body: 'Patient ready for discharge planning discussion.' },
];

export function QuickMessageDialog({ open, onOpenChange, onSend }: QuickMessageDialogProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [urgent, setUrgent] = useState(false);

  const handleSend = () => {
    onSend({ to, subject, body, urgent });
    setTo('');
    setSubject('');
    setBody('');
    setUrgent(false);
    onOpenChange(false);
  };

  const handleTemplateSelect = (template: typeof quickTemplates[0]) => {
    setSubject(template.subject);
    setBody(template.body);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Quick Message</DialogTitle>
          <DialogDescription>Send a message to a doctor or colleague</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient */}
          <div className="space-y-2">
            <label className="text-sm font-medium">To</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select recipient...</option>
              <option value="dr-smith">Dr. Smith (Attending)</option>
              <option value="dr-jones">Dr. Jones (Resident)</option>
              <option value="charge-nurse">Charge Nurse</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="lab">Laboratory</option>
            </select>
          </div>

          {/* Quick Templates */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Templates</label>
            <div className="grid grid-cols-2 gap-2">
              {quickTemplates.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTemplateSelect(template)}
                  className="text-left justify-start h-auto py-2"
                >
                  {template.subject}
                </Button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject..."
              className="w-full h-12 px-4 rounded-lg border border-input bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Message Body */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message..."
              className="w-full min-h-[120px] p-3 rounded-lg border border-input bg-background text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Urgent Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-input">
            <input
              type="checkbox"
              id="urgent"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              className="w-5 h-5 rounded border-input"
            />
            <label htmlFor="urgent" className="flex items-center gap-2 cursor-pointer">
              <AlertCircle className="w-5 h-5 text-urgent" />
              <span className="font-medium">Mark as Urgent</span>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="lg">
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!to || !subject || !body}
            size="lg"
            className="touch-target"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
