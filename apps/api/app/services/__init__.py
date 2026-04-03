"""CityPulse service layer package.

This package intentionally avoids eager re-exports so importing a single
submodule does not trigger the entire service graph and create startup-time
import cycles.
"""

__all__: list[str] = []
