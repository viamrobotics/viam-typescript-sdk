import { useRef } from 'react';
import type { Direction, MotionState, RequestMotion } from '../motion.js';

const DIRECTION_TO_TEXT = {
  forward: '▲',
  backward: '▼',
  left: '◀',
  right: '▶',
};

export interface MovementControlsProps {
  motionState: MotionState;
  requestMotion: RequestMotion;
}

export function MotionArrows({ motionState, requestMotion }: MovementControlsProps): JSX.Element {
  const { forward, backward, left, right } = motionState;

  return (
    <div className='absolute right-8 bottom-8 inline-flex px-2 py-1 rounded-xl bg-white/50'>
      <ArrowButton
        direction='left'
        active={left}
        requestMotion={requestMotion}
      />
      <div className='flex flex-col'>
        <ArrowButton
          direction='forward'
          active={forward}
          requestMotion={requestMotion}
        />
        <ArrowButton
          direction='backward'
          active={backward}
          requestMotion={requestMotion}
        />
      </div>
      <ArrowButton
        direction='right'
        active={right}
        requestMotion={requestMotion}
      />
    </div>
  );
}

interface ArrowButtonProps {
  direction: Direction;
  active: boolean;
  requestMotion: RequestMotion;
}

function ArrowButton({ direction, active, requestMotion }: ArrowButtonProps): JSX.Element {
  const clickedRef = useRef(false);

  const handleMouseDown = () => {
    clickedRef.current = true;
    requestMotion({ direction, state: true });
  };

  const handleMouseUpOrLeave = () => {
    if (clickedRef.current) {
      clickedRef.current = false;
      requestMotion({ direction, state: false });
    }
  };

  return (
    <button
      title={`Move ${direction}`}
      className={`p-1 text-5xl ${active ? 'text-blue-500' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
    >
      {DIRECTION_TO_TEXT[direction]}
    </button>
  );
}
