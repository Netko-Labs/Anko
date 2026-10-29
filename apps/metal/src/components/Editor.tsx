import { Text, TextInput, View } from '@mirinjs/metal'
import type { QueryTab } from '../store'
import { theme } from '../theme'
import { Button, fieldStyle } from './ui'

interface EditorProps {
  tab: QueryTab
  connectionLabel: string | null
  canRun: boolean
  savingName: string | null
  onChange: (sql: string) => void
  onRun: (sql: string) => void
  onStartSave: () => void
  onSavingName: (name: string | null) => void
  onSave: (name: string) => void
}

export function Editor({
  tab,
  connectionLabel,
  canRun,
  savingName,
  onChange,
  onRun,
  onStartSave,
  onSavingName,
  onSave,
}: EditorProps) {
  return (
    <View style={{ flexDirection: 'column', gap: 8, padding: 12, flexShrink: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ color: theme.muted, fontSize: 12, fontFamily: 'monospace' }}>
          {connectionLabel ?? 'Not connected'}
        </Text>
      </View>
      <TextInput
        value={tab.sql}
        multiline
        autoFocus
        placeholder="select ... (Ctrl+Enter runs)"
        onChangeText={onChange}
        onSubmitEditing={(text) => {
          if (canRun) onRun(text)
        }}
        style={{
          minHeight: 150,
          fontFamily: 'monospace',
          fontSize: 14,
          color: theme.text,
          placeholderColor: theme.faint,
          backgroundColor: theme.input,
          borderColor: theme.panelBorder,
          focusBorderColor: theme.accent,
          borderRadius: 8,
          padding: 12,
        }}
        testID="editor"
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <Text style={{ color: theme.faint, fontSize: 12 }}>
          {canRun ? 'Ctrl+Enter runs the query' : 'Connect to a database to run queries'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {savingName === null ? (
            <Button
              label="Save"
              onPress={onStartSave}
              disabled={tab.sql.trim().length === 0}
              testID="save-query"
            />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 200 }}>
                <TextInput
                  value={savingName}
                  placeholder="Query name"
                  autoFocus
                  onChangeText={onSavingName}
                  onSubmitEditing={(name) => {
                    if (name.trim()) onSave(name.trim())
                  }}
                  style={fieldStyle}
                  testID="save-query-name"
                />
              </View>
              <Button label="Cancel" onPress={() => onSavingName(null)} small />
              <Button
                label="Save"
                tone="accent"
                small
                disabled={savingName.trim().length === 0}
                onPress={() => onSave(savingName.trim())}
                testID="save-query-confirm"
              />
            </View>
          )}
          <Button
            label="▷ Run"
            tone="accent"
            onPress={() => onRun(tab.sql)}
            disabled={!canRun}
            testID="run"
          />
        </View>
      </View>
    </View>
  )
}
