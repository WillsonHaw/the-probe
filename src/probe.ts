import * as colors from 'colors';
import { exec as execFn } from 'child_process';
import { SingleBar } from 'cli-progress';
import { promisify } from 'util';
import { concurrent } from './helpers/concurrent';
import { Stream } from './types/Stream';

const exec = promisify(execFn);

interface Matchers {
  video?: Stream;
  audio?: Stream;
  subtitle?: Stream;
}

function probeStreams(
  type: keyof Matchers,
  streams: Stream[],
  matchers: Matchers
): boolean {
  const matcher = matchers[type];

  if (!matcher) {
    return true;
  }

  const filteredStreams = streams.filter(
    (stream) => stream.codec_type === type
  );

  return filteredStreams.some((stream) =>
    Object.keys(matcher).every((key) => {
      const prop = stream[key as keyof Stream];
      const match = matcher[key as keyof Stream];

      return (
        prop &&
        String(prop).toLocaleLowerCase() === String(match).toLocaleLowerCase()
      );
    })
  );
}

async function probeFile(file: string, matchers: Matchers): Promise<boolean> {
  const args = [
    'ffprobe',
    '-print_format json',
    '-show_format',
    '-show_streams',
    `"${file}"`,
  ];

  try {
    const execResult = await exec(args.join(' '));
    const streams: Stream[] = JSON.parse(execResult.stdout).streams;

    return (
      probeStreams('video', streams, matchers) &&
      probeStreams('audio', streams, matchers) &&
      probeStreams('subtitle', streams, matchers)
    );
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function probe(
  files: string[],
  matchers: Matchers,
  numProcesses: number,
  maxCount = Infinity
): Promise<string[]> {
  const bar = new SingleBar({
    format:
      'Progress: ' +
      colors.cyan('{bar}') +
      ' | {percentage}% | {value}/{total} files probed | Found: {foundCount} ',
  });
  const results: string[] = [];
  let foundCount = 0;
  let progress = 0;

  bar.start(files.length, 0, { foundCount: 0 });

  await concurrent<void>(
    files.map((file) => async () => {
      bar.update(++progress, { foundCount });

      if (foundCount >= maxCount) {
        return;
      }

      const result = await probeFile(file, matchers);

      if (result && foundCount < maxCount) {
        foundCount++;

        results.push(file);

        bar.update(progress, { foundCount });
      }
    }),
    numProcesses
  );

  bar.stop();

  return results;
}
