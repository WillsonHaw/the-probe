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
  } = getArgs();

  if (!video && !audio && !subtitle && !container) {
    console.error(
      'At least one video, audio, or subtitle property must be specified!'
    );
    process.exit(1);
  }

  const files = await getFiles(path[0], extensions.split(','));

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
    processes,
    maxResults
  );

  console.log(`Found ${colors.green(results.length.toString())} results`);

  let resultString = results.reduce((acc, result) => {
    acc += `${result.file}\n`;

    if (result.audio) {
      acc += `  ${result.audio} matching audio stream${result.audio > 1 ? 's' : ''}\n`
    }

    if (result.video) {
      acc += `  ${result.video} matching video stream${result.video > 1 ? 's' : ''}\n`
    }

    if (result.subtitle) {
      acc += `  ${result.subtitle} matching subtitle stream${result.subtitle > 1 ? 's' : ''}\n`
    }

    return acc;
  }, '');

  if (out) {
    writeFileSync(out, resultString, 'utf8');
  } else {
    console.log('\n', resultString);
  }
}
