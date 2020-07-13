# Install

`npm i`

# Usage

Run `node index` from wherever you've cloned this repo to with the following options:

```
Options:
  --help             Show help                                         [boolean]
  --version          Show version number                               [boolean]
  --extensions, -x   Comma-separated list of file extensions of media types to
                     scan                                    [string] [required]
  --out, -o          Write results to a file                            [string]
  --max-results, -m  Maximum number of results to return                [number]
  --processes, -p    Number of concurrent processes to spawn when running
                     ffprobe                               [number] [default: 4]
  --video, -v        Video properties to match. Use a dot plus the property name
                     as the comparison value.
  --audio, -a        Audio properties to match. Use a dot plus the property name
                     as the comparison value.
  --subtitle, -s     Subtitle properties to match. Use a dot plus the property
                     name as the comparison value.

Examples:
  node index -x avi mp4 -v.codec_name divx  Finds all divx videos in avi and mp4
                                            containers
  node index -x mkv -v.codec_name h264      Finds all h264 main videos with eac3
  -v.profile main -a.codec_name eac3        audio in an mkv container
```

## Examples

Finds all hevc videos in avi and mp4 containers:

`node index -x avi,mp4 -v.codec_name hevc [PATH_TO_VIDEOS_FOLDER]`

Find all h264 main videos with eac3 audio in an mkv container:

`node index -x mkv -v.codec_name h264 -v.profile main -a.codec_name eac3 [PATH_TO_VIDEOS_FOLDER]`
