import * as yargs from 'yargs';
// import { properties } from './properties';
// import { Stream } from './types/Stream';

export default function getArgs() {
  return yargs
    .option('extensions', {
      alias: 'x',
      type: 'string',
      demandOption: true,
      description:
        'Comma-separated list of file extensions of media types to scan',
    })
    .options('out', {
      alias: 'o',
      type: 'string',
      description: 'Write results to a file',
    })
    .options('max-results', {
      alias: 'm',
      type: 'number',
      description: 'Maximum number of results to return',
    })
    .options('processes', {
      alias: 'p',
      type: 'number',
      default: 4,
      description:
        'Number of concurrent processes to spawn when running ffprobe',
    })
    .option('video', {
      alias: 'v',
      description:
        'Video properties to match. Use a dot plus the property name as the comparison value.',
    })
    .option('audio', {
      alias: 'a',
      description:
        'Audio properties to match. Use a dot plus the property name as the comparison value.',
    })
    .option('subtitle', {
      alias: 's',
      description:
        'Subtitle properties to match. Use a dot plus the property name as the comparison value.',
    })
    .option('container', {
      alias: 'c',
      description:
        'Container properties to match (the "format" object of ffprobe). Use a dot plus the property name as the comparison value',
    })
    .example(
      'node $0 -x avi,mp4 -v.codec_name divx [PATH_TO_VIDEOS_FOLDER]',
      'Finds all divx videos in avi and mp4 containers'
    )
    .example(
      'node $0 -x mkv -v.codec_name h264 -v.profile main -a.codec_name eac3 [PATH_TO_VIDEOS_FOLDER]',
      'Finds all h264 main videos with eac3 audio in an mkv container'
    ).argv;
}
