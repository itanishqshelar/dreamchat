import React from 'react';
import {Text, StyleSheet} from 'react-native';

type TextStyle = {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  code?: boolean;
};

type Segment = {
  text: string;
  style: TextStyle;
};

/**
 * Parse inline markdown tokens into styled segments.
 * Supports: **bold**, *italic*, ***bold+italic***, ~~strikethrough~~, `code`
 */
function tokenize(input: string): Segment[] {
  const segments: Segment[] = [];
  // Pattern matches: ***text***, **text**, *text*, ~~text~~, `text`
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|`(.+?)`)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    // Push any plain text before the match
    if (match.index > lastIndex) {
      segments.push({
        text: input.slice(lastIndex, match.index),
        style: {},
      });
    }

    if (match[2]) {
      // ***bold italic***
      segments.push({text: match[2], style: {bold: true, italic: true}});
    } else if (match[3]) {
      // **bold**
      segments.push({text: match[3], style: {bold: true}});
    } else if (match[4]) {
      // *italic*
      segments.push({text: match[4], style: {italic: true}});
    } else if (match[5]) {
      // ~~strikethrough~~
      segments.push({text: match[5], style: {strikethrough: true}});
    } else if (match[6]) {
      // `code`
      segments.push({text: match[6], style: {code: true}});
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining plain text
  if (lastIndex < input.length) {
    segments.push({text: input.slice(lastIndex), style: {}});
  }

  return segments;
}

type Props = {
  children: string | string[];
  baseStyle?: object | object[];
};

/**
 * Renders a string with inline markdown (bold, italic, code, etc.)
 * as styled React Native <Text> elements.
 */
export default function MarkdownText({children, baseStyle}: Props) {
  const text = Array.isArray(children) ? children.join('') : children;
  const segments = tokenize(text);

  return (
    <Text style={baseStyle}>
      {segments.map((seg, i) => {
        const textStyles: object[] = [];
        if (seg.style.bold) {
          textStyles.push(mdStyles.bold);
        }
        if (seg.style.italic) {
          textStyles.push(mdStyles.italic);
        }
        if (seg.style.strikethrough) {
          textStyles.push(mdStyles.strikethrough);
        }
        if (seg.style.code) {
          textStyles.push(mdStyles.code);
        }

        if (textStyles.length === 0) {
          return <Text key={i}>{seg.text}</Text>;
        }

        return (
          <Text key={i} style={textStyles}>
            {seg.text}
          </Text>
        );
      })}
    </Text>
  );
}

const mdStyles = StyleSheet.create({
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 4,
    borderRadius: 4,
    fontSize: 13,
  },
});
