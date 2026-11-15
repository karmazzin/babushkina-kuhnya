# Installed version in settings

Build stamps the loaded HTML with `1.0.0 · <8-character release ID>`. Identity is computed with a neutral stamp; the final stamped HTML gets its own integrity hash. This avoids a self-referential hash and makes repeated builds deterministic. Runtime captures this page's version once and displays it as text in settings, without consulting a waiting or newly activated worker.

Verified in Chrome at 320×568: settings fit, version readable. Open version 7c88f844 continued to show its own label after 0def1b1b downloaded. Applying the update changed the label to 0def1b1b. Automated test verifies page stamp against release ID and the actual HTML integrity hash. Physical phones not tested.
