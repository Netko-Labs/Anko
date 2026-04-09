/**
 * Electrobun postBuild hook.
 * Signs custom native libraries that Electrobun doesn't sign automatically.
 * Runs after file copying but before Electrobun's own codesigning step.
 */
import { execSync } from 'node:child_process'

const buildDir = process.env.ELECTROBUN_BUILD_DIR
const buildEnv = process.env.ELECTROBUN_BUILD_ENV
const signingIdentity = process.env.ELECTROBUN_DEVELOPER_ID

if (!buildDir) {
  console.log('No ELECTROBUN_BUILD_DIR set, skipping post-build signing')
  process.exit(0)
}

if (buildEnv === 'dev' || !signingIdentity) {
  console.log('Dev build or no signing identity, skipping post-build signing')
  process.exit(0)
}

const appName = process.env.ELECTROBUN_APP_NAME ?? 'Anko'
const dylibPath = `${buildDir}/${appName}.app/Contents/Resources/app/native/libWindowDrag.dylib`

const file = Bun.file(dylibPath)
if (await file.exists()) {
  console.log(`Signing ${dylibPath}`)
  execSync(
    `codesign --force --verbose --timestamp --sign "${signingIdentity}" --options runtime "${dylibPath}"`,
  )
  console.log('libWindowDrag.dylib signed successfully')
} else {
  console.log(`libWindowDrag.dylib not found at ${dylibPath}, skipping`)
}
