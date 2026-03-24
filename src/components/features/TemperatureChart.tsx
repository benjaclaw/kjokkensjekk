import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, {
  Line,
  Polyline,
  Circle,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { colors, spacing, borderRadius, typography } from "../../theme";
import type { TemperatureReading, TemperatureDevice } from "../../types";

interface Props {
  device: TemperatureDevice;
  readings: TemperatureReading[];
}

const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 16, right: 16, bottom: 28, left: 42 };

function formatTime(ts: number, span: "24h" | "7d"): string {
  const d = new Date(ts);
  if (span === "24h") {
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }
  const days = ["søn", "man", "tir", "ons", "tor", "fre", "lør"];
  return days[d.getDay()];
}

export function TemperatureChart({ device, readings }: Props) {
  const [chartWidth, setChartWidth] = useState(300);

  if (readings.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Ingen målinger ennå</Text>
      </View>
    );
  }

  const sorted = [...readings].sort((a, b) => a.recordedAt - b.recordedAt);

  const plotW = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
  const plotH = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  // Y-axis range with padding
  const temps = sorted.map((r) => r.temperature);
  const allValues = [...temps, device.minTemp, device.maxTemp];
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const yPadding = Math.max((dataMax - dataMin) * 0.15, 1);
  const yMin = dataMin - yPadding;
  const yMax = dataMax + yPadding;

  // X-axis range
  const xMin = sorted[0].recordedAt;
  const xMax = sorted[sorted.length - 1].recordedAt;
  const xRange = xMax - xMin || 1;

  const toX = (ts: number) =>
    CHART_PADDING.left + ((ts - xMin) / xRange) * plotW;
  const toY = (temp: number) =>
    CHART_PADDING.top + ((yMax - temp) / (yMax - yMin)) * plotH;

  // Build polyline points and color segments
  const points = sorted.map((r) => ({
    x: toX(r.recordedAt),
    y: toY(r.temperature),
    temp: r.temperature,
    ts: r.recordedAt,
    inRange: r.temperature >= device.minTemp && r.temperature <= device.maxTemp,
  }));

  // Build segments: consecutive points of same in/out status
  const segments: { points: string; color: string }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const bothInRange = p1.inRange && p2.inRange;
    segments.push({
      points: `${p1.x},${p1.y} ${p2.x},${p2.y}`,
      color: bothInRange ? colors.success : colors.danger,
    });
  }

  // Reference lines for min/max
  const minLineY = toY(device.minTemp);
  const maxLineY = toY(device.maxTemp);

  // Y-axis labels (min, max, and midpoint)
  const yMid = (yMin + yMax) / 2;
  const yLabels = [
    { value: device.maxTemp, y: maxLineY },
    { value: device.minTemp, y: minLineY },
  ];
  // Add mid label only if it's not too close to min/max
  if (
    Math.abs(yMid - device.minTemp) > (yMax - yMin) * 0.15 &&
    Math.abs(yMid - device.maxTemp) > (yMax - yMin) * 0.15
  ) {
    yLabels.push({ value: Math.round(yMid * 10) / 10, y: toY(yMid) });
  }

  // X-axis labels: first, middle, last
  const span: "24h" | "7d" =
    xRange > 2 * 24 * 3600 * 1000 ? "7d" : "24h";
  const xLabels = [
    { label: formatTime(sorted[0].recordedAt, span), x: points[0].x },
  ];
  if (sorted.length > 2) {
    const midIdx = Math.floor(sorted.length / 2);
    xLabels.push({
      label: formatTime(sorted[midIdx].recordedAt, span),
      x: points[midIdx].x,
    });
  }
  xLabels.push({
    label: formatTime(sorted[sorted.length - 1].recordedAt, span),
    x: points[points.length - 1].x,
  });

  return (
    <View
      style={styles.container}
      onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
    >
      <Svg width={chartWidth} height={CHART_HEIGHT}>
        {/* Background */}
        <Rect
          x={CHART_PADDING.left}
          y={CHART_PADDING.top}
          width={plotW}
          height={plotH}
          fill={colors.surface}
          rx={4}
        />

        {/* Min/max reference lines (dashed) */}
        <Line
          x1={CHART_PADDING.left}
          y1={minLineY}
          x2={CHART_PADDING.left + plotW}
          y2={minLineY}
          stroke={colors.border}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
        <Line
          x1={CHART_PADDING.left}
          y1={maxLineY}
          x2={CHART_PADDING.left + plotW}
          y2={maxLineY}
          stroke={colors.border}
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {/* Data line segments */}
        {segments.map((seg, i) => (
          <Polyline
            key={i}
            points={seg.points}
            fill="none"
            stroke={seg.color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}

        {/* Data points */}
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={p.inRange ? colors.success : colors.danger}
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((l, i) => (
          <SvgText
            key={i}
            x={CHART_PADDING.left - 6}
            y={l.y + 4}
            textAnchor="end"
            fontSize={10}
            fill={colors.textMuted}
          >
            {l.value}°
          </SvgText>
        ))}

        {/* X-axis labels */}
        {xLabels.map((l, i) => (
          <SvgText
            key={i}
            x={l.x}
            y={CHART_HEIGHT - 4}
            textAnchor="middle"
            fontSize={10}
            fill={colors.textMuted}
          >
            {l.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  empty: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  emptyText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.small,
    color: colors.textMuted,
  },
});
