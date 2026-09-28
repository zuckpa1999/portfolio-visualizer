# Holdings store a manually entered THB value, not units × price

Each Snapshot records every Holding's value in THB, typed in by hand. We considered storing units and pulling prices automatically (Thai SEC fund NAV API, stock price feeds, FX rates for USD stocks) to cut down on manual updates, but chose manual THB values: they keep the model simple, match how the owner already reads balances off each app, and USD holdings are a negligible share and are converted by hand. Revisit this if manual entry becomes the main pain again.
