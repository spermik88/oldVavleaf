import React from "react";
import Svg, { Polyline } from "react-native-svg";

type Point = { x: number; y: number };

type Props = {
  points: Point[];
};

export default function LeafContour({ points }: Props) {
  if (!points || points.length === 0) return null;

  const path = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <Svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 5,
      }}
    >
      <Polyline
        points={path}
        fill="none"
        stroke="lime"
        strokeWidth={2}
        strokeDasharray="6"
      />
    </Svg>
  );
}
