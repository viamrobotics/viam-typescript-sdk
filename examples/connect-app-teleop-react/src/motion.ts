import type { BaseClient } from '@viamrobotics/sdk';
import { useEffect, useReducer } from 'react';

export interface MotionState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

export type Direction = 'forward' | 'backward' | 'left' | 'right';

export interface MoveRequest {
  direction: Direction;
  state: boolean;
}

export type RequestMotion = (request: MoveRequest) => void;

export const useMotionControls = (
  base: BaseClient | undefined
): [state: MotionState, dispatch: RequestMotion] => {
  const [state, dispatch] = useReducer(reduceMoveRequest, {
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const handleKeyEvent = (event: KeyboardEvent) => {
      dispatch(mapKeyboardToMoveRequest(event));
    };

    if (base) {
      window.addEventListener('keyup', handleKeyEvent);
      window.addEventListener('keydown', handleKeyEvent);
    }

    return () => {
      window.removeEventListener('keyup', handleKeyEvent);
      window.removeEventListener('keydown', handleKeyEvent);
    };
  }, [base]);

  const yLinearPower = (state.forward ? 1 : 0) + (state.backward ? -1 : 0);
  const zAngularPower = (state.left ? 1 : 0) + (state.right ? -1 : 0);

  useEffect(() => {
    if (base) {
      const linearPower = { x: 0, y: yLinearPower, z: 0 };
      const angularPower = { x: 0, y: 0, z: zAngularPower };

      base
        .setPower(linearPower, angularPower)
        .catch((error) => console.warn('Error setting base power', error));
    }
  }, [base, yLinearPower, zAngularPower]);

  useEffect(() => {
    return () => {
      if (base) {
        base
          .stop()
          .catch((error) => console.warn('Error stopping base', error));
      }
    };
  }, [base]);

  return [state, dispatch];
};

const reduceMoveRequest = (
  state: MotionState,
  request: MoveRequest | undefined
) => {
  return request && state[request.direction] !== request.state
    ? { ...state, [request.direction]: request.state }
    : state;
};

const mapKeyboardToMoveRequest = (
  event: KeyboardEvent
): MoveRequest | undefined => {
  const isPressed = event.type === 'keydown';

  switch (event.key) {
    case 'ArrowUp':
    case 'w':
    case 'k': {
      return { direction: 'forward', state: isPressed };
    }

    case 'ArrowDown':
    case 's':
    case 'j': {
      return { direction: 'backward', state: isPressed };
    }

    case 'ArrowLeft':
    case 'a':
    case 'h': {
      return { direction: 'left', state: isPressed };
    }

    case 'ArrowRight':
    case 'd':
    case 'l': {
      return { direction: 'right', state: isPressed };
    }
  }

  return undefined;
};
