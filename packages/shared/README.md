# @kapa/shared

Shared domain types, constants, and utilities for Kapa monorepo projects (`apps/mobile-web`, `apps/server`).

## Structure

- `types/`: Domain models (`Animal`, `Especie`, `Sexo`, `Porte`, etc.) and API response types.
- `constants/`: Chip options, dropdown definitions, labels, and shared constants.
- `utils/`: Universal helper functions (date formatting, string helpers, etc.).

## Usage

```typescript
import { Animal, Especie, ESPECIE_OPTIONS, hojeBr } from '@kapa/shared';
```
