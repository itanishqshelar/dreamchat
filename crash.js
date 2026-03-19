const { execSync } = require('child_process');
try {
  const adb = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';
  const result = execSync(`"${adb}" logcat -d -b crash`).toString('utf8');
  console.log(result.slice(-2000));
} catch (e) {
  console.log(e.toString());
}
