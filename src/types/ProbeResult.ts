import { Container } from './Container';
import { Stream } from './Stream';

export interface ProbeResult {
  streams: Stream[];
  format: Container;
}
