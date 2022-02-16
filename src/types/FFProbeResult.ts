import { Container } from './Container';
import { Stream } from './Stream';

export interface FFProbeResult {
  streams: Stream[];
  format: Container;
}
