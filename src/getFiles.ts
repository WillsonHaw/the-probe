import * as glob from 'glob';
import { resolve as resolvePath } from 'path';

/**
 * Gets all files in root path with specified file extensions
 * @param root Root path
 * @param extensions File extensions
 */
export function getFiles(
  root: string,
  extensions: string[]
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    glob(
      `./**/*.+(${extensions.join('|')})`,
      {
        cwd: resolvePath(root),
      },
      (error, matches) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(matches.map((path) => resolvePath(root, path)));
      }
    );
  });
}
