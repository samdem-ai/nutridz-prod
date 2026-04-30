import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Easing,
  Alert, Pressable, ScrollView, Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { Theme } from '../src/constants/theme';
import api from '../src/services/api';
import Markdown from '../src/components/ui/Markdown';
import { useAuthStore } from '../src/store/authStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

const PROMPT_DEFS = [
  { key: 'Healthy', icon: 'restaurant' as const, color: '#22C55E', prompt: 'Propose-moi une recette algérienne saine pour ce soir, avec ingrédients et étapes.' },
  { key: 'WeightLoss', icon: 'fitness' as const, color: '#3B82F6', prompt: 'Quels sont les meilleurs aliments algériens pour perdre du poids sans avoir faim ?' },
  { key: 'Protein', icon: 'barbell' as const, color: '#F59E0B', prompt: 'Comment augmenter mon apport en protéines avec des plats traditionnels ?' },
  { key: 'Hydration', icon: 'water' as const, color: '#06B6D4', prompt: 'Combien d\'eau dois-je boire par jour selon mon profil ?' },
];

export default function ChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Typing dots animation
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (loading) {
      const animateDot = (val: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(val, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(val, { toValue: 0.3, duration: 400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          ])
        );
      const a1 = animateDot(dot1, 0);
      const a2 = animateDot(dot2, 150);
      const a3 = animateDot(dot3, 300);
      a1.start(); a2.start(); a3.start();
      return () => { a1.stop(); a2.stop(); a3.stop(); };
    }
  }, [loading]);

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/chat', { message: text }, { timeout: 60000 });
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Pas de réponse',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('chat.errorMsg'),
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const retryLastMessage = () => {
    // Find last user message and re-send
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        // Remove the failed assistant message that follows
        setMessages((prev) => prev.filter((_, idx) => idx <= i));
        sendMessage(messages[i].content);
        return;
      }
    }
  };

  const copyToClipboard = async (content: string) => {
    // Fallback without expo-clipboard: show the content for manual copy
    Alert.alert('Message', content, [
      { text: 'Fermer', style: 'cancel' },
    ]);
  };

  const clearChat = () => {
    if (messages.length === 0) return;
    Alert.alert(
      t('chat.newChat'),
      t('chat.clearConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('chat.clear'), style: 'destructive', onPress: () => setMessages([]) },
      ]
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.role === 'user';
    const showAvatar = index === 0 || messages[index - 1]?.role !== item.role;
    const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.role !== item.role;

    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={styles.avatarSlot}>
            {showAvatar && (
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={14} color={Colors.primary} />
              </View>
            )}
          </View>
        )}

        <Pressable
          onLongPress={() => copyToClipboard(item.content)}
          delayLongPress={300}
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            item.error && styles.errorBubble,
            !showAvatar && (isUser ? { marginRight: 0 } : { marginLeft: 0 }),
            !isLastInGroup && (isUser
              ? { borderBottomRightRadius: 16 }
              : { borderBottomLeftRadius: 16 }),
          ]}
        >
          {isUser ? (
            <Text style={[styles.messageText, styles.userText]}>{item.content}</Text>
          ) : (
            <Markdown text={item.content} />
          )}
          {item.error && (
            <TouchableOpacity onPress={retryLastMessage} style={styles.retryBtn} activeOpacity={0.7}>
              <Ionicons name="refresh" size={14} color={Colors.warning} />
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          )}
        </Pressable>

        {isUser && (
          <View style={styles.avatarSlot}>
            {showAvatar && (
              user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.userAvatar} />
              ) : (
                <View style={styles.userAvatarFallback}>
                  <Text style={styles.userAvatarText}>
                    {(user?.username || '?')[0].toUpperCase()}
                  </Text>
                </View>
              )
            )}
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => (
    <View style={styles.messageRow}>
      <View style={styles.avatarSlot}>
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={14} color={Colors.primary} />
        </View>
      </View>
      <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
        <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
        <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
        <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
      </View>
    </View>
  );

  const renderEmpty = () => (
    <ScrollView
      contentContainerStyle={styles.welcome}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Glowy hero icon */}
      <View style={styles.heroOuter}>
        <View style={styles.heroInner}>
          <Ionicons name="sparkles" size={36} color={Colors.primary} />
        </View>
      </View>

      <Text style={styles.welcomeTitle}>{t('chat.greeting', { username: user?.username || '' })}</Text>
      <Text style={styles.welcomeSub}>
        {t('chat.subtitle')}
      </Text>

      {/* Capability tags */}
      <View style={styles.capRow}>
        <View style={styles.capTag}>
          <Ionicons name="language" size={11} color={Colors.primary} />
          <Text style={styles.capText}>{t('chat.capLanguages')}</Text>
        </View>
        <View style={styles.capTag}>
          <Ionicons name="flag" size={11} color={Colors.primary} />
          <Text style={styles.capText}>{t('chat.capAlgerian')}</Text>
        </View>
        <View style={styles.capTag}>
          <Ionicons name="shield-checkmark" size={11} color={Colors.primary} />
          <Text style={styles.capText}>{t('chat.capPersonalized')}</Text>
        </View>
      </View>

      {/* Suggestions grid 2x2 */}
      <View style={styles.gridLabel}>
        <Ionicons name="bulb-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.suggestionsLabel}>{t('chat.forStarting')}</Text>
      </View>
      <View style={styles.grid}>
        {PROMPT_DEFS.map((s, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.gridCard, { borderColor: s.color + '30' }]}
            onPress={() => sendMessage(s.prompt)}
            activeOpacity={0.7}
          >
            <View style={[styles.gridIcon, { backgroundColor: s.color + '20' }]}>
              <Ionicons name={s.icon} size={20} color={s.color} />
            </View>
            <Text style={styles.gridTitle}>{t(`chat.prompt${s.key}`)}</Text>
            <Text style={styles.gridSub} numberOfLines={2}>{t(`chat.prompt${s.key}Sub`)}</Text>
            <View style={styles.gridArrow}>
              <Ionicons name="arrow-forward" size={12} color={s.color} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.disclaimerText}>
          {t('chat.disclaimer')}
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Ionicons name="sparkles" size={14} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{t('chat.title')}</Text>
            <Text style={styles.headerSub}>
              {loading ? t('chat.writing') : t('chat.online')}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {messages.length === 0 ? (
          renderEmpty()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            ListFooterComponent={loading ? renderTypingIndicator : null}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={t('chat.placeholder')}
              placeholderTextColor={Colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || loading) && styles.sendDisabled,
              ]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="arrow-up" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            {t('chat.longPressHint')}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.background,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  headerTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.primary,
    marginTop: -1,
  },
  // Welcome / empty state
  welcome: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xxxl,
  },
  heroOuter: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.primary + '08',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  heroInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary + '50',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: Theme.spacing.lg,
  },
  capRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: Theme.spacing.lg,
  },
  capTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  capText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  gridLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Theme.spacing.xxl,
    marginBottom: Theme.spacing.md,
    marginLeft: 4,
  },
  suggestionsLabel: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    minHeight: 120,
    position: 'relative',
  },
  gridIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 3,
  },
  gridSub: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },
  gridArrow: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: Theme.spacing.xxl,
    paddingHorizontal: Theme.spacing.lg,
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  // Messages
  messagesList: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
    gap: 6,
  },
  messageRowUser: { justifyContent: 'flex-end' },
  avatarSlot: { width: 28 },
  aiAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  userAvatar: { width: 28, height: 28, borderRadius: 14 },
  userAvatarFallback: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  errorBubble: {
    backgroundColor: Colors.warning + '15',
    borderColor: Colors.warning + '40',
  },
  messageText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  userText: { color: '#FFF' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  retryText: { color: Colors.warning, fontSize: 12, fontWeight: '700' },
  // Typing indicator
  typingBubble: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  typingDot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },
  // Input
  inputContainer: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingHorizontal: Theme.spacing.md,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: Colors.inputBg,
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  input: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    paddingVertical: 10,
    maxHeight: 120,
    minHeight: 40,
  },
  sendButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    margin: 4,
    ...Theme.glow.subtle,
  },
  sendDisabled: { backgroundColor: Colors.surfaceLight, shadowOpacity: 0 },
  hint: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
});
