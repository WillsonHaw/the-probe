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
  --container, -c    Container properties to match (the "format" object of
                     ffprobe). Use a dot plus the property name as the
                     comparison value
```

## Examples

Finds all hevc videos in avi and mp4 containers:

`node index -x avi,mp4 -v.codec_name hevc [PATH_TO_VIDEOS_FOLDER]`

Find all h264 main videos with eac3 audio in an mkv container:

`node index -x mkv -v.codec_name h264 -v.profile main -a.codec_name eac3 [PATH_TO_VIDEOS_FOLDER]`

Finds all mkv h264 videos with width less than 1920

`node index -x mkv -v.codec_name h264 -v.width '<1920' [PATH_TO_VIDEOS_FOLDER]`

Finds all mp4 h264 720p or higher videos

`node index -x mp4 -v.codec_name h264 -v.height '>=720' [PATH_TO_VIDEOS_FOLDER]`

Finds all mkv h264 videos that are not 720p

`node index -x mkv -v.codec_name h264 -v.height '!720' [PATH_TO_VIDEOS_FOLDER]`

Finds all mkv videos that was encoded with libmatroska

`node index -x mkv -c.tags.encoder '~libmatroska' [PATH_TO_VIDEOS_FOLDER]`
