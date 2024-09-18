import { useEffect, useRef, type ReactNode } from 'react';

export interface VideoStreamProps {
  stream?: MediaStream;
  children?: ReactNode;
}

export const VideoStream = (props: VideoStreamProps): JSX.Element => {
  const { stream, children } = props;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className='relative inline-flex p-4'>
      <video ref={videoRef} autoPlay muted />
      {children}
    </div>
  );
};
