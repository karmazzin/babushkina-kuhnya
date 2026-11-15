# Installed version in settings

Build stamps the loaded HTML with `1.0.0 · <8-character release ID>`. Identity is computed with a neutral stamp; the final stamped HTML gets its own integrity hash. This avoids a self-referential hash and makes repeated builds deterministic. Runtime captures this page's version once and displays it as text in settings, without consulting a waiting or newly activated worker.

Verified in Chrome at 320×568: settings fit, version readable. Open version 7c88f844 continued to show its own label after 0def1b1b downloaded. Applying the update changed the label to 0def1b1b. Automated test verifies page stamp against release ID and the actual HTML integrity hash. Physical phones not tested.

## Sequential version refinement
The visible release is now `package.json.version` (1.0.1), with the technical build on a separate smaller line. `npm run release:patch` advances the next release once and builds it; ordinary builds remain deterministic. The semantic version participates in release identity, while the build stamp is normalized before hashing. Verified 320×568 settings layout and all 150 tests, including agreement between package version, page metadata, cache identity and HTML hash. Future release procedure is documented in README and AGENTS.
