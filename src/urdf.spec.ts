import { describe, expect, it } from 'vitest';
import { parseUrdf } from './urdf';

const URDF = `<?xml version="1.0" ?>
<robot name="UF_ROBOT">
  <link name="world"/>

  <joint name="world_joint" type="fixed">
    <parent link="world"/>
    <child link="link_base"/>
    <origin rpy="0 0 0" xyz="0 0 0"/>
  </joint>

  <link name="link_base">
    <collision>
      <geometry>
        <mesh filename="package://meshes/link_base.stl"/>
      </geometry>
      <origin rpy="0 0 0" xyz="0 0 0"/>
    </collision>
  </link>

  <joint name="joint1" type="revolute">
    <parent link="link_base"/>
    <child link="link1"/>
    <origin rpy="0 0 1.5708" xyz="0 0 0.267"/>
    <axis xyz="0 0 1"/>
    <limit effort="50.0" lower="-6.28" upper="6.28" velocity="3.14"/>
  </joint>

  <link name="link1">
    <collision>
      <geometry>
        <box size="0.1 0.2 0.3"/>
      </geometry>
    </collision>
  </link>
</robot>`;

describe('parseUrdf', () => {
  const result = parseUrdf(URDF);
  const [worldLink, linkBase, link1] = result.links;

  it('reads the robot name and reports SVA params after conversion', () => {
    expect(result.name).toBe('UF_ROBOT');
    expect(result.kinematic_param_type).toBe('SVA');
  });

  it('excludes fixed joints and converts revolute limits to degrees', () => {
    expect(result.joints).toHaveLength(1);
    const [joint1] = result.joints;
    expect(joint1?.id).toBe('joint1');
    expect(joint1?.type).toBe('revolute');
    expect(joint1?.parent).toBe('link_base');
    expect(joint1?.axis).toStrictEqual({ x: 0, y: 0, z: 1 });
    // ±6.28 rad -> degrees.
    expect(joint1?.max).toBeCloseTo(359.817, 3);
    expect(joint1?.min).toBeCloseTo(-359.817, 3);
  });

  it('derives each link pose from the joint that positions it', () => {
    expect(result.links).toHaveLength(3);

    // The root link has no positioning joint, so it is parented to the world.
    expect(worldLink?.parent).toBe('world');

    // link_base is positioned by the fixed world_joint.
    expect(linkBase?.parent).toBe('world');
    expect(linkBase?.translation).toEqual({ x: 0, y: 0, z: 0 });

    // link1 is positioned by joint1's origin; 0.267 m -> 267 mm.
    expect(link1?.parent).toBe('link_base');
    expect(link1?.translation).toEqual({ x: 0, y: 0, z: 267 });
    expect(link1?.orientation?.type).toEqual({
      case: 'eulerAngles',
      value: { roll: 0, pitch: 0, yaw: 1.5708 },
    });
  });

  it('maps mesh geometry, preserving the filename on the label', () => {
    expect(linkBase?.geometry?.geometryType.case).toBe('mesh');
    expect(linkBase?.geometry?.label).toBe('package://meshes/link_base.stl');
  });

  it('maps primitive geometry, converting dimensions to millimeters', () => {
    expect(link1?.geometry?.geometryType.case).toBe('box');
    const box = link1?.geometry?.geometryType.value;
    // "0.1 0.2 0.3" m -> mm.
    expect(box && 'dimsMm' in box ? box.dimsMm : undefined).toEqual({
      x: 100,
      y: 200,
      z: 300,
    });
  });

  it('throws on a document with no <robot> element', () => {
    expect(() => parseUrdf('<nope/>')).toThrow('missing <robot> element');
  });
});
