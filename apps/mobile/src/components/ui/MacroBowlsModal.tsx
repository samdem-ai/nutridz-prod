import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import MacroBowl from './MacroBowl';
import { Colors } from '../../constants/colors';
import { Theme } from '../../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  caloriesTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
}

export default function MacroBowlsModal({
  visible,
  onClose,
  calories,
  protein,
  carbs,
  fat,
  caloriesTarget,
  proteinTarget,
  carbsTarget,
  fatTarget,
}: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={26} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('journal.title')}</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>{t('bowls.title')}</Text>

          {/* 2x2 grid — all visible w/o scroll */}
          <View style={styles.grid}>
            <View style={styles.cell}>
              <MacroBowl
                label={t('journal.calories')}
                value={calories}
                target={caloriesTarget || 2000}
                unit=" kcal"
                color={Colors.macros.calories}
                width={150}
                height={170}
              />
            </View>
            <View style={styles.cell}>
              <MacroBowl
                label={t('journal.proteins')}
                value={protein}
                target={proteinTarget || 150}
                color={Colors.macros.proteines}
                width={150}
                height={170}
              />
            </View>
            <View style={styles.cell}>
              <MacroBowl
                label={t('journal.carbs')}
                value={carbs}
                target={carbsTarget || 250}
                color={Colors.macros.glucides}
                width={150}
                height={170}
              />
            </View>
            <View style={styles.cell}>
              <MacroBowl
                label={t('journal.fats')}
                value={fat}
                target={fatTarget || 65}
                color={Colors.macros.lipides}
                width={150}
                height={170}
              />
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.legendText}>{t('bowls.overflowLegend')}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
  },
  closeBtn: { padding: 4, width: 32 },
  title: { fontSize: Theme.fontSize.xl, fontWeight: Theme.fontWeight.bold, color: Colors.text },
  content: { flex: 1, padding: Theme.spacing.lg, alignItems: 'center' },
  subtitle: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Theme.spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    rowGap: Theme.spacing.lg,
    width: '100%',
    maxWidth: 380,
  },
  cell: { width: '48%', alignItems: 'center' },
  legend: { marginTop: Theme.spacing.xl, gap: 6, alignSelf: 'stretch', alignItems: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary },
});
