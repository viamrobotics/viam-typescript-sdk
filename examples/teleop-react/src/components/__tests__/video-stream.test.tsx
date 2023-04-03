import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { VideoStream } from '../video-stream.js';

describe('VideoStream component', () => {
  it('should not render a video if no stream', () => {
    render(<VideoStream stream={undefined} />);

    console.log(screen.getByRole('video'));
  });
});
