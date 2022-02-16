import * as colors from 'colors';
import { exec as execFn } from 'child_process';
import { SingleBar } from 'cli-progress';
import { promisify } from 'util';
import { concurrent } from './helpers/concurrent';
import { Stream } from './types/Stream';
import { Container } from './types/Container';
import { FFProbeResult } from './types/FFProbeResult';

const exec = promisify(execFn);

interface Matchers {
  video?: Stream;
  audio?: Stream;
  subtitle?: Stream;
  container?: Container;
}

export interface ProbeResult {
  file: string;
  audio?: number;
  video?: number;
  subtitle?: number;
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

    if (typeof match === 'string' && match[0] === '!') {
      return (
        String(prop).toLocaleLowerCase() !==
        String(match.slice(1)).toLocaleLowerCase()
      );
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
): number | undefined {
  if (!matcher) {
    return undefined;
  }

  const filteredStreams = streams.filter(
    (stream) => stream.codec_type === type
  );

  return filteredStreams.filter((stream) => compareObjects(stream, matcher)).length;
}

function probeContainer(container: Container, matcher?: Container): boolean {
  if (!matcher) {
    return true;
  }

  return compareObjects(container, matcher);
}

async function probeFile(file: string, matchers: Matchers): Promise<ProbeResult | undefined> {
  const args = [
    'ffprobe',
    '-print_format json',
    '-show_format',
    '-show_streams',
    `"${file}"`,
  ];

  try {
    const execResult = await exec(args.join(' '));
    const result: FFProbeResult = JSON.parse(execResult.stdout);

    const videoProbeResult = probeStreams('video', result.streams, matchers.video);
    const audioProbeResult = probeStreams('audio', result.streams, matchers.audio);
    const subtitleProbeResult = probeStreams('subtitle', result.streams, matchers.subtitle);

    const probeHasResults = probeContainer(result.format, matchers.container) &&
      (videoProbeResult == null || videoProbeResult > 0) &&
      (audioProbeResult == null || audioProbeResult > 0) &&
      (subtitleProbeResult == null || subtitleProbeResult > 0);

    return probeHasResults ? {
      file,
      video: videoProbeResult,
      audio: result.streams.filter(s => s.codec_type === 'audio').length,
      subtitle: subtitleProbeResult
    } : undefined;
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

export async function probe(
  files: string[],
  matchers: Matchers,
  numProcesses: number,
  maxCount = Infinity
): Promise<ProbeResult[]> {
  const bar = new SingleBar({
    format:
      'Progress: ' +
      colors.cyan('{bar}') +
      ' | {percentage}% | {value}/{total} files probed | Found: {foundCount} ',
  });
  const results: ProbeResult[] = [];
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

        results.push(result);

        bar.update(progress, { foundCount });
      }
    }),
    numProcesses
  );

  bar.stop();

  return results;
}
