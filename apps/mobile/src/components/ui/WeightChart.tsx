import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

type WeightPoint = { date: string; weightKg: number };

type Props = {
  data: WeightPoint[];
  height?: number;
};

const SCREEN_W = Dimensions.get('window').width;

export default function WeightChart({ data, height = 180 }: Props) {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Pas encore de donnees</Text>
      </View>
    );
  }

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const weights = sorted.map((d) => d.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const padded = range < 2 ? 2 : range;

  const chartW = SCREEN_W - Theme.spacing.lg * 2 - Theme.spacing.lg * 2;
  const chartH = height - 40;

  const points = sorted.map((p, i) => {
    const x = sorted.length === 1 ? chartW / 2 : (i / (sorted.length - 1)) * chartW;
    const y = chartH - ((p.weightKg - min) / padded) * chartH;
    return { x, y, weight: p.weightKg, date: p.date };
  });

  // Build line segments
  const segments = points.slice(0, -1).map((p, i) => {
    const next = points[i + 1];
    const dx = next.x - p.x;
    const dy = next.y - p.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return { x: p.x, y: p.y, length, angle };
  });

  const change = weights[weights.length - 1] - weights[0];

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.plot, { height: chartH, width: chartW }]}>
        {/* Grid line */}
        <View style={[styles.gridLine, { top: chartH / 2 }]} />

        {/* Line segments */}
        {segments.map((s, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y,
              width: s.length,
              height: 2.5,
              backgroundColor: change <= 0 ? Colors.primary : Colors.warning,
              transform: [{ translateY: -1.25 }, { rotate: `${s.angle}deg` }],
              transformOrigin: '0% 50%' as any,
              borderRadius: 2,
            }}
          />
        ))}

        {/* Points */}
        {points.map((p, i) => (
          <View
            key={i}
            style={[
              styles.point,
              {
                left: p.x - 5,
                top: p.y - 5,
                backgroundColor: change <= 0 ? Colors.primary : Colors.warning,
              },
            ]}
          />
        ))}

        {/* Y-axis labels */}
        <Text style={[styles.axisLabel, { top: -4, left: -32 }]}>{max.toFixed(1)}</Text>
        <Text style={[styles.axisLabel, { top: chartH - 8, left: -32 }]}>{min.toFixed(1)}</Text>
      </View>

      {/* X-axis hints */}
      <View style={styles.xAxisRow}>
        <Text style={styles.xLabel}>{formatDate(sorted[0]?.date)}</Text>
        <Text style={styles.xLabel}>{formatDate(sorted[sorted.length - 1]?.date)}</Text>
      </View>
    </View>
  );
}

function formatDate(d?: string) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingLeft: 36,
    paddingRight: 4,
  },
  plot: {
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    opacity: 0.5,
  },
  point: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  axisLabel: {
    position: 'absolute',
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: Theme.fontWeight.semibold,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  xLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Theme.fontSize.sm,
  },
});
