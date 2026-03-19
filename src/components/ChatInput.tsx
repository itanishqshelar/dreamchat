import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';
import {Colors, Spacing, FontSize, BorderRadius} from '../theme/colors';

type Props = {
  onSend: (text: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
};

export default function ChatInput({onSend, onStop, disabled, isGenerating}: Props) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) {
      return;
    }
    onSend(text);
    setText('');
    Keyboard.dismiss();
  };

  const handleStop = () => {
    if (onStop) {
      onStop();
    }
  };

  // Show stop button when generating
  if (isGenerating) {
    return (
      <View style={styles.container}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Message DreamChat..."
            placeholderTextColor={Colors.inputPlaceholder}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={4096}
            editable={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, styles.stopButtonActive]}
            onPress={handleStop}
            activeOpacity={0.7}>
            <View style={styles.sendIcon}>
              <View style={styles.stopSquare} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Message DreamChat..."
          placeholderTextColor={Colors.inputPlaceholder}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={4096}
          editable={!disabled}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            text.trim() && !disabled
              ? styles.sendButtonActive
              : styles.sendButtonInactive,
          ]}
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          activeOpacity={0.7}>
          <View style={styles.sendIcon}>
            <View style={styles.arrow} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.inputBg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
    minHeight: 48,
  },
  input: {
    flex: 1,
    color: Colors.inputText,
    fontSize: FontSize.md,
    maxHeight: 120,
    paddingVertical: Spacing.sm,
    lineHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
    marginBottom: 2,
  },
  sendButtonActive: {
    backgroundColor: Colors.accent,
  },
  sendButtonInactive: {
    backgroundColor: Colors.bgTertiary,
  },
  stopButtonActive: {
    backgroundColor: Colors.error,
  },
  sendIcon: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.textOnAccent,
    marginBottom: 2,
  },
  stopSquare: {
    width: 10,
    height: 10,
    backgroundColor: Colors.textOnAccent,
    borderRadius: 2,
  },
});
