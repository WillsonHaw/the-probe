import * as colors from 'colors';
import { writeFileSync } from 'fs';
import getArgs from './getArgs';
import { getFiles } from './getFiles';
import { probe } from './probe';
import { Stream } from './types/Stream';

export async function main(): Promise<void> {
  const {
    video,
    audio,
    subtitle,
    processes,
    'max-results': maxResults,
    _: path,
    extensions,
    out,
  } = getArgs();

  if (!video && !audio && !subtitle) {
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
    },
    processes,
    maxResults
  );

  console.log(`Found ${colors.green(results.length.toString())} results`);

  if (out) {
    writeFileSync(out, results.join('\n'), 'utf8');
  } else {
    console.log('\n', results.join('\n'));
  }
}
