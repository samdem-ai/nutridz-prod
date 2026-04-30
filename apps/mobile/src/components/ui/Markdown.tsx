import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

type Props = {
  text: string;
  baseStyle?: TextStyle;
};

// Lightweight markdown renderer — supports headers, bold, italic, code, lists, line breaks.
export default function Markdown({ text, baseStyle }: Props) {
  const lines = (text || '').split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  lines.forEach((line, i) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <View key={`code-${i}`} style={styles.codeBlock}>
            <Text style={styles.codeText}>{codeBuffer.join('\n')}</Text>
          </View>
        );
        codeBuffer = [];
      }
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Headers
    const h3 = line.match(/^###\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const h1 = line.match(/^#\s+(.*)/);
    if (h1) {
      elements.push(<Text key={i} style={[styles.h1, baseStyle]}>{renderInline(h1[1])}</Text>);
      return;
    }
    if (h2) {
      elements.push(<Text key={i} style={[styles.h2, baseStyle]}>{renderInline(h2[1])}</Text>);
      return;
    }
    if (h3) {
      elements.push(<Text key={i} style={[styles.h3, baseStyle]}>{renderInline(h3[1])}</Text>);
      return;
    }

    // Bullet list
    const bullet = line.match(/^\s*[-*•]\s+(.*)/);
    if (bullet) {
      elements.push(
        <View key={i} style={styles.bulletRow}>
          <Text style={[styles.bullet, baseStyle]}>•</Text>
          <Text style={[styles.bulletText, baseStyle]}>{renderInline(bullet[1])}</Text>
        </View>
      );
      return;
    }

    // Numbered list
    const numbered = line.match(/^\s*(\d+)\.\s+(.*)/);
    if (numbered) {
      elements.push(
        <View key={i} style={styles.bulletRow}>
          <Text style={[styles.numBullet, baseStyle]}>{numbered[1]}.</Text>
          <Text style={[styles.bulletText, baseStyle]}>{renderInline(numbered[2])}</Text>
        </View>
      );
      return;
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<View key={i} style={styles.spacer} />);
      return;
    }

    // Paragraph
    elements.push(
      <Text key={i} style={[styles.para, baseStyle]}>
        {renderInline(line)}
      </Text>
    );
  });

  return <View>{elements}</View>;
}

// Parse inline formatting: **bold**, *italic*, `code`, ~~strike~~
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Tokenize
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|~~[^~]+~~)/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(<Text key={key++} style={styles.bold}>{token.slice(2, -2)}</Text>);
    } else if (token.startsWith('*')) {
      parts.push(<Text key={key++} style={styles.italic}>{token.slice(1, -1)}</Text>);
    } else if (token.startsWith('`')) {
      parts.push(<Text key={key++} style={styles.inlineCode}>{token.slice(1, -1)}</Text>);
    } else if (token.startsWith('~~')) {
      parts.push(<Text key={key++} style={styles.strike}>{token.slice(2, -2)}</Text>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

const styles = StyleSheet.create({
  para: {
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 4,
  },
  h1: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 6,
  },
  h2: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
    marginTop: 6,
    marginBottom: 4,
  },
  h3: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.text,
    marginTop: 4,
    marginBottom: 2,
  },
  bullet: {
    color: Colors.primary,
    fontSize: Theme.fontSize.md,
    marginRight: 8,
    marginTop: 1,
    fontWeight: Theme.fontWeight.bold,
  },
  numBullet: {
    color: Colors.primary,
    fontSize: Theme.fontSize.md,
    marginRight: 8,
    minWidth: 22,
    fontWeight: Theme.fontWeight.semibold,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  bulletText: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  bold: {
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text,
  },
  italic: {
    fontStyle: 'italic',
  },
  inlineCode: {
    backgroundColor: Colors.surfaceLight,
    color: Colors.primary,
    paddingHorizontal: 4,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  strike: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  codeBlock: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  codeText: {
    color: Colors.text,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  spacer: { height: 6 },
});
