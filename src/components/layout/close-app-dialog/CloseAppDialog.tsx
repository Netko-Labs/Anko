import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type CloseAppDialogProps } from './definitions'
import { CLOSE_APP_VALUES } from './definitions/values'
import { setCloseAppPreference } from './close-app-preference/CloseAppPreference'

export function CloseAppDialog({ open, onOpenChange, onConfirm, onCancel }: CloseAppDialogProps) {
  const [rememberChoice, setRememberChoice] = useState(false)

  const handleClose = () => {
    if (rememberChoice) {
      setCloseAppPreference('always-close')
    }
    onConfirm()
  }

  const handleCancel = () => {
    if (rememberChoice) {
      setCloseAppPreference('never-close')
    }
    onCancel()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{CLOSE_APP_VALUES.title}</DialogTitle>
          <DialogDescription>
            {CLOSE_APP_VALUES.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id="remember-choice"
            checked={rememberChoice}
            onCheckedChange={(checked) => setRememberChoice(checked === true)}
          />
          <label
            htmlFor="remember-choice"
            className="text-sm text-muted-foreground cursor-pointer select-none"
          >
            {CLOSE_APP_VALUES.rememberChoice}
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {CLOSE_APP_VALUES.cancelButton}
          </Button>
          <Button onClick={handleClose}>{CLOSE_APP_VALUES.closeButton}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
