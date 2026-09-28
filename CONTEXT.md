# Portfolio Visualizer

A personal tool for recording what my investment portfolio is worth, seeing how it is split across categories, and seeing whether it has gone up or down since the last update.

## Language

### Holdings

**Holding**:
A single position with a value in THB, held in one account or app (e.g. `SCBSEMI(E)(SCBAM)`, `Cash (alphacredit)`).
_Avoid_: Asset, position, row

**Closed Holding**:
A holding whose value has dropped to zero because it was sold or emptied. It stays in past snapshots but is no longer something you update.
_Avoid_: Deleted, archived

### Classification

**Grouping**:
One way of dividing the portfolio into categories (e.g. "Product": cash / SP500 / MRT-GQ / BTC, or "Asset class": cash / bond / stocks / gold). Every holding has exactly one category in each grouping.
_Avoid_: Mode, view, category type

**Category**:
One group within a grouping. A holding that mixes asset classes (e.g. MRT-MG, "bond + 10% gold") goes entirely into its main category and is never split across categories.
_Avoid_: Asset, type, class

### Valuation

**Portfolio Value**:
The sum of every holding's value at a point in time, always in Thai baht (THB).
_Avoid_: Total, net worth

**Snapshot**:
A timestamped record of the value of every holding in the portfolio at one moment. Holdings not updated in that session carry their previous value forward.
_Avoid_: Update, entry, version

**Draft**:
Value edits you've started but not saved yet. A draft is not a snapshot and doesn't count in any comparison until it's saved.
_Avoid_: Pending snapshot

**Change vs Previous**:
The difference (in THB and %) between a snapshot and the snapshot saved just before it.
_Avoid_: Delta, diff

**Monthly Change**:
The difference between a snapshot and the last snapshot of the previous calendar month.
_Avoid_: MoM, month delta

**Invested Amount**:
How much money you have put into a holding. It is different from the holding's value, and the difference between the two is profit or loss.
_Avoid_: Cost, amount, principal
