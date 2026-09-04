import { palette } from "@/theme/colors";
import { StyleSheet } from "react-native";

export const primaryChipStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: palette.orange,
    borderColor: palette.orange,
  },
  label: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  labelSelected: {
    color: palette.white,
  },
});
