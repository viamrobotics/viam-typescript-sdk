import { useRef, useEffect } from 'react';

export interface VideoStreamProps {
  stream?: MediaStream;
}

export const VideoStream = (props: VideoStreamProps): JSX.Element => {
  const { stream } = props;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={videoRef} autoPlay muted className="p-4" />;
};
