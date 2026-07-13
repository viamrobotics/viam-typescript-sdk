import { XMLParser } from 'fast-xml-parser';
import { Frame } from './gen/app/v1/robot_pb';
import { Capsule, Geometry, Mesh, RectangularPrism, Sphere } from './gen/common/v1/common_pb';
import type { Vector3 } from './types';
import type { KinematicsData } from './utils';

/*
 * A URDF (Unified Robot Description Format) parser, emitting the SDK's shared
 * {@link KinematicsData} type so URDF kinematics can be consumed identically to
 * the native (JSON) kinematics format.
 *
 * URDF is XML describing a robot as a tree of rigid `<link>`s connected by
 * `<joint>`s. A joint carries the static transform (its `<origin>`) from its
 * parent link to its child link, so each link's pose in {@link KinematicsData}
 * is derived from the joint for which it is the child.
 */

const ATTRIBUTE_PREFIX = '@_';

/** The raw, attribute-bearing object produced by {@link XMLParser}. */
type XMLNode = Record<string, unknown>;

/** A parsed URDF `<origin>` element. */
type UrdfOrigin = XMLNode;

/** Read an XML attribute (e.g. `name="foo"`) off a parsed node. */
const getAttribute = (node: unknown, attribute: string): string | undefined => {
  if (node === null || typeof node !== 'object') {
    return undefined;
  }
  const value = (node as XMLNode)[`${ATTRIBUTE_PREFIX}${attribute}`];
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return value === undefined ? undefined : String(value);
};

/** Parse a string to a number, falling back to `defaultValue` when invalid. */
const parseNumber = (value: string | undefined, defaultValue = 0): number => {
  if (value === undefined) {
    return defaultValue;
  }
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? defaultValue : num;
};

/** Parse a space-separated `"x y z"` string into a {@link Vector3}. */
const parseVector3 = (value: string | undefined, defaultValue?: Vector3): Vector3 => {
  const fallback = defaultValue ?? { x: 0, y: 0, z: 0 };
  if (value === undefined) {
    return fallback;
  }
  const parts = value.trim().split(/\s+/u);
  if (parts.length !== 3) {
    return fallback;
  }
  return {
    x: parseNumber(parts[0], fallback.x),
    y: parseNumber(parts[1], fallback.y),
    z: parseNumber(parts[2], fallback.z),
  };
};

/*
 * URDF expresses lengths in meters and angles in radians, but the RDK spatial
 * model (SVA) it is converted into expects millimeters and degrees. These
 * mirror `utils.MetersToMM` and `utils.RadToDeg` in RDK's URDF parser.
 */

/** Convert meters to millimeters. */
const metersToMm = (meters: number): number => meters * 1000;

/** Convert each component of a meter-valued vector to millimeters. */
const vector3MetersToMm = (vector: Vector3): Vector3 => ({
  x: metersToMm(vector.x),
  y: metersToMm(vector.y),
  z: metersToMm(vector.z),
});

/** Convert radians to degrees. */
const radToDeg = (radians: number): number => (radians * 180) / Math.PI;

/** XML elements that repeat are arrays; singletons are not. Normalize to array. */
const ensureArray = <T>(element: T | T[] | undefined): T[] => {
  if (element === undefined) {
    return [];
  }
  return Array.isArray(element) ? element : [element];
};

/** Convert a URDF `<origin rpy="...">` into a Frame orientation. */
const orientationFromRpy = (
  origin: UrdfOrigin | undefined,
):
  | { type: { case: 'eulerAngles'; value: { roll: number; pitch: number; yaw: number } } }
  | undefined => {
  const rpy = getAttribute(origin, 'rpy');
  if (rpy === undefined) {
    return undefined;
  }
  const { x: roll, y: pitch, z: yaw } = parseVector3(rpy);
  return {
    type: { case: 'eulerAngles' as const, value: { roll, pitch, yaw } },
  };
};

/** Convert a URDF `<geometry>` element into a common Geometry message. */
const processGeometry = (link: XMLNode, label: string): Geometry | undefined => {
  const source = ensureArray(link.collision ?? link.visual)[0] as XMLNode | undefined;
  const geometry = source?.geometry as XMLNode | undefined;
  if (geometry === undefined) {
    return undefined;
  }

  if (geometry.mesh !== undefined) {
    // The mesh bytes themselves arrive separately (keyed by filepath); the
    // filename is preserved on the label so callers can resolve them.
    return new Geometry({
      label: getAttribute(geometry.mesh, 'filename') ?? label,
      geometryType: { case: 'mesh', value: new Mesh() },
    });
  }
  if (geometry.box !== undefined) {
    return new Geometry({
      label,
      geometryType: {
        case: 'box',
        value: new RectangularPrism({
          dimsMm: vector3MetersToMm(parseVector3(getAttribute(geometry.box, 'size'))),
        }),
      },
    });
  }
  if (geometry.sphere !== undefined) {
    return new Geometry({
      label,
      geometryType: {
        case: 'sphere',
        value: new Sphere({
          radiusMm: metersToMm(parseNumber(getAttribute(geometry.sphere, 'radius'))),
        }),
      },
    });
  }
  if (geometry.cylinder !== undefined) {
    // Viam has no cylinder primitive; a capsule is the closest approximation.
    return new Geometry({
      label,
      geometryType: {
        case: 'capsule',
        value: new Capsule({
          radiusMm: metersToMm(parseNumber(getAttribute(geometry.cylinder, 'radius'))),
          lengthMm: metersToMm(parseNumber(getAttribute(geometry.cylinder, 'length'))),
        }),
      },
    });
  }
  return undefined;
};

/**
 * Convert a URDF `<joint>` element into a KinematicsData joint, applying RDK's limit conventions:
 * revolute limits are degrees, prismatic limits are millimeters, and a continuous joint is an
 * unbounded revolute joint.
 */
const processJoint = (joint: XMLNode): KinematicsData['joints'][number] => {
  const type = getAttribute(joint, 'type') ?? '';
  const lower = parseNumber(getAttribute(joint.limit, 'lower'));
  const upper = parseNumber(getAttribute(joint.limit, 'upper'));

  let min = lower;
  let max = upper;
  let resolvedType = type;
  switch (type) {
    case 'continuous': {
      // A continuous joint is a revolute joint with no limits.
      resolvedType = 'revolute';
      min = Number.NEGATIVE_INFINITY;
      max = Number.POSITIVE_INFINITY;
      break;
    }
    case 'prismatic': {
      min = metersToMm(lower);
      max = metersToMm(upper);
      break;
    }
    case 'revolute': {
      min = radToDeg(lower);
      max = radToDeg(upper);
      break;
    }
    default: {
      break;
    }
  }

  return {
    id: getAttribute(joint, 'name') ?? '',
    type: resolvedType,
    parent: getAttribute(joint.parent, 'link') ?? '',
    axis: parseVector3(getAttribute(joint.axis, 'xyz'), { x: 1, y: 0, z: 0 }),
    max,
    min,
  };
};

/**
 * Convert a URDF `<link>` into a Frame. The link's pose comes from the joint for which it is the
 * child (its parent link and `<origin>` transform); a link with no such joint (e.g. the root) is
 * parented to the world frame.
 */
const processLink = (link: XMLNode, joint: XMLNode | undefined): Frame => {
  const origin = joint?.origin as UrdfOrigin | undefined;
  return new Frame({
    parent: joint ? (getAttribute(joint.parent, 'link') ?? 'world') : 'world',
    translation: vector3MetersToMm(parseVector3(getAttribute(origin, 'xyz'))),
    orientation: orientationFromRpy(origin),
    geometry: processGeometry(link, getAttribute(link, 'name') ?? ''),
  });
};

/**
 * Parse a URDF XML document into the SDK's shared {@link KinematicsData} shape.
 *
 * @param urdf - The URDF document as an XML string.
 */
export const parseUrdf = (urdf: string): KinematicsData => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: ATTRIBUTE_PREFIX,
    allowBooleanAttributes: true,
  });
  const robot = (parser.parse(urdf) as XMLNode).robot as XMLNode | undefined;
  if (robot === undefined) {
    throw new Error('Invalid URDF: missing <robot> element');
  }

  const jointElements = ensureArray(robot.joint) as XMLNode[];
  const linkElements = ensureArray(robot.link) as XMLNode[];

  // Index each joint by the child link it positions.
  const jointByChild = new Map<string, XMLNode>();
  for (const joint of jointElements) {
    const child = getAttribute(joint.child, 'link');
    if (child !== undefined) {
      jointByChild.set(child, joint);
    }
  }

  return {
    name: getAttribute(robot, 'name') ?? '',
    // The URDF has been converted into RDK's spatial (SVA) parameters:
    // millimeters, degrees, and joint-relative frame transforms.
    kinematic_param_type: 'SVA',
    // Fixed joints are static transforms rather than movable joints; they still
    // position their child link but are not actuatable, so they are omitted here.
    joints: jointElements
      .filter((joint) => getAttribute(joint, 'type') !== 'fixed')
      .map((joint) => processJoint(joint)),
    links: linkElements.map((link) =>
      processLink(link, jointByChild.get(getAttribute(link, 'name') ?? '')),
    ),
  };
};
