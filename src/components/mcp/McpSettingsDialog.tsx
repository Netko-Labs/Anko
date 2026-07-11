import { Switch } from '@base-ui/react/switch'
import {
  IconCheck,
  IconClipboard,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconRefresh,
} from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  getMcpSettings,
  installMcpBridge,
  rotateMcpToken,
  setMcpEnabled,
  setMcpPort,
} from '@/lib/rpc'
import { useMcpStore } from '@/stores/mcp'

export function McpSettingsDialog() {
  const open = useMcpStore((state) => state.settingsOpen)
  const settings = useMcpStore((state) => state.settings)
  const setOpen = useMcpStore((state) => state.setSettingsOpen)
  const setSettings = useMcpStore((state) => state.setSettings)
  const [showToken, setShowToken] = useState(false)
  const [port, setPort] = useState('43821')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    void getMcpSettings()
      .then((value) => {
        setSettings(value)
        setPort(String(value.port))
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : String(error)))
  }, [open, setSettings])

  const run = async (action: () => Promise<typeof settings>) => {
    setBusy(true)
    try {
      const next = await action()
      if (next) {
        setSettings(next)
        setPort(String(next.port))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg gap-3">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Local Model Context Protocol access</DialogDescription>
        </DialogHeader>

        {settings && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <div className="font-medium">MCP server</div>
                <div className="text-muted-foreground">Authenticated localhost access</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={settings.status === 'error' ? 'destructive' : 'outline'}
                  className="rounded-md"
                >
                  {settings.status}
                </Badge>
                <Switch.Root
                  checked={settings.enabled}
                  disabled={busy}
                  onCheckedChange={(enabled) => void run(() => setMcpEnabled(enabled))}
                  className="h-5 w-9 rounded-full bg-muted p-0.5 transition-colors data-checked:bg-primary"
                  aria-label="Enable MCP server"
                >
                  <Switch.Thumb className="block size-4 rounded-full bg-background shadow-sm transition-transform data-checked:translate-x-4" />
                </Switch.Root>
              </div>
            </div>

            {settings.error && <p className="text-destructive">{settings.error}</p>}

            <SettingRow label="Port">
              <div className="flex gap-1.5">
                <Input
                  value={port}
                  type="number"
                  min={1024}
                  max={65535}
                  onChange={(event) => setPort(event.target.value)}
                  className="w-28 font-mono"
                />
                <Button
                  variant="outline"
                  disabled={busy || Number(port) === settings.port}
                  onClick={() => void run(() => setMcpPort(Number(port)))}
                >
                  Apply
                </Button>
              </div>
            </SettingRow>

            <SettingRow label="HTTP endpoint">
              <CopyValue
                value={settings.endpoint}
                onCopy={() => copy(settings.endpoint, 'Endpoint')}
              />
            </SettingRow>

            <SettingRow label="Bearer token">
              <div className="flex min-w-0 gap-1">
                <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1.5 font-mono">
                  {showToken ? settings.token : '•'.repeat(32)}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowToken((value) => !value)}
                  title={showToken ? 'Hide token' : 'Reveal token'}
                >
                  {showToken ? <IconEyeOff /> : <IconEye />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => void copy(settings.token, 'Token')}
                  title="Copy token"
                >
                  <IconClipboard />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={busy}
                  onClick={() => void run(rotateMcpToken)}
                  title="Rotate token"
                >
                  <IconRefresh />
                </Button>
              </div>
            </SettingRow>

            <SettingRow label="Stdio bridge">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  {settings.bridgeInstalled ? (
                    <IconCheck className="size-3.5 text-green-500" />
                  ) : null}
                  <span>
                    {settings.bridgeStatus === 'installed'
                      ? 'Installed'
                      : settings.bridgeStatus === 'outdated'
                        ? 'Update required'
                        : 'Not installed'}
                  </span>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => void run(installMcpBridge)}
                  >
                    <IconDownload data-icon="inline-start" />
                    {settings.bridgeStatus === 'missing' ? 'Install' : 'Reinstall'}
                  </Button>
                </div>
                <CopyValue
                  value={settings.bridgePath}
                  onCopy={() => copy(settings.bridgePath, 'Bridge command')}
                />
              </div>
            </SettingRow>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-muted-foreground">Pending approvals</span>
              <Badge
                variant={settings.pendingApprovals ? 'default' : 'outline'}
                className="rounded-md"
              >
                {settings.pendingApprovals}
              </Badge>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-3">
      <span className="pt-1.5 text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function CopyValue({ value, onCopy }: { value: string; onCopy: () => void }) {
  return (
    <div className="flex min-w-0 gap-1">
      <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2 py-1.5 font-mono">
        {value}
      </code>
      <Button variant="outline" size="icon" onClick={onCopy} title="Copy">
        <IconClipboard />
      </Button>
    </div>
  )
}
