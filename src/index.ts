import * as colors from 'colors';
import { writeFileSync } from 'fs';
import getArgs from './getArgs';
import { getFiles } from './getFiles';
import { probe } from './probe';
import { Stream } from './types/Stream';
import { Container } from './types/Container';

export async function main(): Promise<void> {
  const {
    video,
    audio,
    subtitle,
    processes,
    'max-results': maxResults,
    _: path,
    extensions,
    container,
    out,
  } = await getArgs();

  if (!video && !audio && !subtitle && !container) {
    console.error(
      'At least one video, audio, or subtitle property must be specified!'
    );
    process.exit(1);
  }

  process.on('SIGINT', function () {
    // Move cursor to new line because the progress bar doesn't do it when interrupted
    console.log("\n");
    process.exit();
  });

  const files = await getFiles(path[0] as string, extensions.split(','));

  console.log(
    `Found ${files.length} files that match provided extensions: ${extensions}`
  );
  console.log('Running ffprobe on files...');

  const results = await probe(
    files,
    {
      video: video as Stream,
      audio: audio as Stream,
      subtitle: subtitle as Stream,
      container: container as Container,
    },
    {
      numProcesses: processes,
      maxCount: maxResults,
      onProbeResult: (result) => {
        let resultString = `${result.file}\n`;

        if ((result.audio ?? 0) > 1) {
          resultString += `  matched ${result.audio} audio streams\n`
        }

        if ((result.video ?? 0) > 1) {
          resultString += `  matched ${result.video} video streams\n`
        }

        if ((result.subtitle ?? 0) > 1) {
          resultString += `  matched ${result.subtitle} subtitle streams\n`
        }

        if (out) {
          writeFileSync(out, resultString, 'utf8');
        } else {
          process.stdout.write("\r\x1b[K")
          process.stdout.write(resultString);
        }
      }
    }
  );

  process.stdout.write(`\n\nFound ${colors.green(results.length.toString())} results\n`);
}
