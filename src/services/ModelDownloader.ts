import ReactNativeBlobUtil from 'react-native-blob-util';

const MODEL_URL =
  'https://huggingface.co/unsloth/Qwen3.5-2B-GGUF/resolve/main/Qwen3.5-2B-Q4_K_M.gguf';
const MODEL_FILENAME = 'Qwen3.5-2B-Q4_K_M.gguf';

function getModelDir(): string {
  return `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/models`;
}

export function getModelPath(): string {
  return `${getModelDir()}/${MODEL_FILENAME}`;
}

export async function isModelDownloaded(): Promise<boolean> {
  const path = getModelPath();
  return ReactNativeBlobUtil.fs.exists(path);
}

export type DownloadProgress = {
  received: number;
  total: number;
  percent: number;
};

export async function downloadModel(
  onProgress: (p: DownloadProgress) => void,
): Promise<string> {
  const dir = getModelDir();
  const dirExists = await ReactNativeBlobUtil.fs.exists(dir);
  if (!dirExists) {
    await ReactNativeBlobUtil.fs.mkdir(dir);
  }

  const modelPath = getModelPath();

  // Check if already downloaded
  const alreadyExists = await ReactNativeBlobUtil.fs.exists(modelPath);
  if (alreadyExists) {
    onProgress({received: 0, total: 0, percent: 1});
    return modelPath;
  }

  return new Promise<string>((resolve, reject) => {
    ReactNativeBlobUtil.config({
      path: modelPath,
      fileCache: true,
    })
      .fetch('GET', MODEL_URL)
      .progress({count: 10}, (received: number, total: number) => {
        onProgress({
          received,
          total,
          percent: total > 0 ? received / total : 0,
        });
      })
      .then(res => {
        resolve(res.path());
      })
      .catch(err => {
        reject(err);
      });
  });
}

export async function deleteModel(): Promise<void> {
  const path = getModelPath();
  const exists = await ReactNativeBlobUtil.fs.exists(path);
  if (exists) {
    await ReactNativeBlobUtil.fs.unlink(path);
  }
}
