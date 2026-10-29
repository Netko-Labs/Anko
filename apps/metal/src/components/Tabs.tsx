import { ScrollView, Text, View } from '@mirinjs/metal'
import type { QueryTab } from '../store'
import { theme } from '../theme'
import { IconButton } from './ui'

interface TabsProps {
  tabs: QueryTab[]
  activeId: string
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onNew: () => void
}

export function Tabs({ tabs, activeId, onSelect, onClose, onNew }: TabsProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 38,
        backgroundColor: theme.panel,
        borderWidth: 1,
        borderColor: theme.panelBorder,
        flexShrink: 0,
      }}
    >
      <ScrollView style={{ flex: 1, flexDirection: 'row', overflow: 'scroll-x' }}>
        {tabs.map((tab) => {
          const active = tab.id === activeId
          return (
            <View
              key={tab.id}
              onPress={() => onSelect(tab.id)}
              testID={`tab:${tab.id}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                height: 38,
                paddingHorizontal: 14,
                backgroundColor: active ? theme.bg : undefined,
                hoverBackgroundColor: active ? undefined : theme.hover,
                borderWidth: 1,
                borderColor: active ? theme.accent : theme.panelBorder,
              }}
            >
              <Text style={{ color: theme.accent, fontSize: 11 }}>{'</>'}</Text>
              <Text
                numberOfLines={1}
                style={{
                  color: active ? theme.text : theme.muted,
                  fontSize: 12,
                  fontWeight: active ? 'semibold' : 'normal',
                }}
              >
                {tab.title}
              </Text>
              {tab.status === 'running' ? (
                <Text style={{ color: theme.accent, fontSize: 10 }}>…</Text>
              ) : null}
              <IconButton glyph="×" onPress={() => onClose(tab.id)} testID={`close:${tab.id}`} />
            </View>
          )
        })}
      </ScrollView>
      <View style={{ paddingHorizontal: 8 }}>
        <IconButton glyph="+" onPress={onNew} testID="new-tab" />
      </View>
    </View>
  )
}
