import { Text, TextInput, View } from '@mirinjs/metal'
import { theme } from '../theme'

interface EditorProps {
  sql: string
  canRun: boolean
  onChange: (sql: string) => void
  onRun: (sql: string) => void
}

export function Editor({ sql, canRun, onChange, onRun }: EditorProps) {
  return (
    <View style={{ flexDirection: 'column', gap: 8, padding: 12, flexShrink: 0 }}>
      <TextInput
        value={sql}
        multiline
        autoFocus
        placeholder="select ... (Ctrl+Enter runs)"
        onChangeText={onChange}
        onSubmitEditing={(text) => {
          if (canRun) onRun(text)
        }}
        testID="editor"
        style={{
          minHeight: 160,
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
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: theme.faint, fontSize: 12 }}>
          {canRun ? 'Ctrl+Enter runs the query' : 'Connect to a database to run queries'}
        </Text>
        <View
          onPress={() => {
            if (canRun) onRun(sql)
          }}
          testID="run"
          style={{
            paddingHorizontal: 16,
            paddingVertical: 7,
            borderRadius: 6,
            backgroundColor: canRun ? theme.accent : theme.raised,
            hoverBackgroundColor: canRun ? '#f472b6' : undefined,
          }}
        >
          <Text
            style={{
              color: canRun ? theme.accentText : theme.faint,
              fontSize: 13,
              fontWeight: 'semibold',
            }}
          >
            ▷ Run
          </Text>
        </View>
      </View>
    </View>
  )
}
