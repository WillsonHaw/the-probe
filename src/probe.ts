import * as colors from 'colors';
import { exec as execFn } from 'child_process';
import { SingleBar } from 'cli-progress';
import { promisify } from 'util';
import { concurrent } from './helpers/concurrent';
import { Stream } from './types/Stream';
import { Container } from './types/Container';
import { ProbeResult } from './types/ProbeResult';

const exec = promisify(execFn);

interface Matchers {
  video?: Stream;
  audio?: Stream;
  subtitle?: Stream;
  container?: Container;
}

function compareObjects<T, K extends keyof T>(
  obj: T,
  compareProps: Partial<T>
): boolean {
  return Object.keys(compareProps).every((key) => {
    let prop = obj[key as K];
    let match = compareProps[key as K];

    if (prop == null) {
      return false;
    }

    while (typeof prop === 'object' && typeof match === 'object') {
      return compareObjects(prop as T[K], match as Partial<T[K]>);
    }

    if (typeof match === 'string' && match[0] === '>') {
      if (match[1] === '=') {
        return parseFloat(String(prop)) >= parseFloat(match.slice(2));
      }

      return parseFloat(String(prop)) > parseFloat(match.slice(1));
    }

    if (typeof match === 'string' && match[0] === '<') {
      if (match[1] === '=') {
        return parseFloat(String(prop)) <= parseFloat(match.slice(2));
      }

      return parseFloat(String(prop)) < parseFloat(match.slice(1));
    }

    if (typeof match === 'string' && match[0] === '~') {
      return String(prop)
        .toLocaleLowerCase()
        .includes(match.slice(1).toLocaleLowerCase());
    }

    return (
      String(prop).toLocaleLowerCase() === String(match).toLocaleLowerCase()
    );
  });
}

function probeStreams(
  type: keyof Matchers,
  streams: Stream[],
  matcher?: Stream
): boolean {
  if (!matcher) {
    return true;
  }

  const filteredStreams = streams.filter(
    (stream) => stream.codec_type === type
  );

  return filteredStreams.some((stream) => compareObjects(stream, matcher));
}

function probeContainer(container: Container, matcher?: Container): boolean {
  if (!matcher) {
    return true;
  }

  return compareObjects(container, matcher);
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
    const result: ProbeResult = JSON.parse(execResult.stdout);

    return (
      probeStreams('video', result.streams, matchers.video) &&
      probeStreams('audio', result.streams, matchers.audio) &&
      probeStreams('subtitle', result.streams, matchers.subtitle) &&
      probeContainer(result.format, matchers.container)
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
