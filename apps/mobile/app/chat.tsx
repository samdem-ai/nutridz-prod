import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { Theme } from '../src/constants/theme';
import api from '../src/services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatScreen() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Java backend has no chat sessions — single conversation history per user.
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Java endpoint: POST /chat  body { message }  response { reply, sentAt }
      const { data } = await api.post('/chat', {
        message: userMessage.content,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desole, une erreur est survenue. Reessayez.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
      <Text style={[styles.messageText, item.role === 'user' && styles.userText]}>
        {item.content}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Welcome */}
      {messages.length === 0 && (
        <View style={styles.welcome}>
          <View style={styles.welcomeIconBg}>
            <Ionicons name="nutrition" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.welcomeTitle}>{t('chat.title')}</Text>
          <Text style={styles.disclaimer}>{t('chat.disclaimer')}</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={Colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Ionicons
            name={loading ? 'hourglass' : 'arrow-up'}
            size={20}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  welcome: {
    alignItems: 'center',
    padding: Theme.spacing.xxl,
    marginTop: Theme.spacing.xxxl,
  },
  welcomeIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
  },
  welcomeTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
    marginBottom: Theme.spacing.sm,
  },
  disclaimer: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  messagesList: { padding: Theme.spacing.lg, paddingBottom: Theme.spacing.md },
  messageBubble: {
    maxWidth: '80%',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.sm,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  messageText: { fontSize: Theme.fontSize.md, color: Colors.text, lineHeight: 22 },
  userText: { color: '#FFF' },
  inputRow: {
    flexDirection: 'row',
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Theme.spacing.sm,
  },
  sendDisabled: { backgroundColor: Colors.surfaceLight },
  sendText: { color: '#FFF', fontSize: 20, fontWeight: Theme.fontWeight.bold },
});
