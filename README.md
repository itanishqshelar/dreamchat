<h1 align="center">DreamChat</h1>
<p align="center">
  <img src="./assets/dream-chat-logo-copy.png" alt="DreamChat Logo" width="260" height="100" />
</p>

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Llama.cpp](https://img.shields.io/badge/Llama.rn-offline_AI-FF9900?style=for-the-badge)
![iOS](https://img.shields.io/badge/iOS-000000?style=for-the-badge&logo=ios&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)

</div>
DreamChat is a fast, completely offline AI assistant built with React Native. It runs Large Language Models (LLMs) locally on your device without an internet connection, ensuring 100% privacy and blazing-fast response times. Powered by `llama.rn` and optimized with local KV-caching.

---

##  Features

- **100% Offline Chatting**: Run advanced language models entirely on your mobile device. Zero API calls, zero tracking, total privacy.
- **Lightning Fast**: Optimized with KV-caching so follow-up message generation begins instantly without reparsing context.
- **Hardware Accelerated**: Offloads model processing to your GPU (Metal on iOS / Vulkan on Android) for smooth real-time token streaming.
- **Session Management**: Persistent chat history via unified sidebar. Switch between different conversations without losing the context cache.
- **Beautiful UI**: Modern, glass-morphic dark mode design with fluid animations powered by `react-native-reanimated`.
- **Intelligent Formatting**: Parses and renders markdown flawlessly, with custom controls allowing you to stop model generation gracefully.

## Tech Stack

- **Framework**: React Native (CLI v0.84.1)
- **Language**: TypeScript
- **Local AI Engine**: `llama.rn` (llama.cpp bindings for React Native)
- **File System / Storage**: `react-native-blob-util`
- **Animations**: `react-native-reanimated`

## Getting Started

> **Prerequisite**: Ensure you have the [React Native CLI environment](https://reactnative.dev/docs/environment-setup) set up correctly for your OS (Android Studio / Xcode, Node.js >= 22.11).

### 1. Clone & Install Dependencies

```bash
# Install node dependencies
npm install
# or
yarn install

# Install iOS CocoaPods
cd ios && bundle exec pod install && cd ..
```

### 2. Start the Metro Bundler

```bash
npm start
# or
yarn start
```

### 3. Run the App

Open a new terminal and run for your desired platform:

**Android:**

```bash
npm run android
# or
yarn android
```

**iOS:**

```bash
npm run ios
# or
yarn ios
```

## Model Integration

DreamChat manages its own model files (`.gguf` format) within the app sandbox. On initial launch, the app downloads a lightweight and optimized base model locally. Once downloaded, all inferences process directly on-device.

- **KV-Caching**: Each chat session has its own isolated KV-cache file saved locally. When you return to a previous conversation, it instantly restores context—making follow-up interactions significantly faster.
- **Hardware Optimization**: Processing utilizes up to 99 GPU layers via Metal (iOS) or Vulkan (Android).

## 📁 Project Structure

```text
src/
├── components/      # Reusable UI elements (ChatInput, ChatMessage, Sidebar)
├── hooks/           # Custom React hooks (useChat state manager)
├── screens/         # Main screens (ChatScreen, DownloadScreen, LoadingScreen)
├── services/        # Core business logic (LlamaService, ModelDownloader, SessionService)
├── theme/           # UI styling constants (Colors, Spacing)
└── utils/           # Shared utility functions
```

## 🤝 Contributing

Contributions are always welcome! Feel free to open an issue or submit a pull request if you'd like to improve DreamChat.

## 📄 License

This project is open-source and ready for you to build upon.
