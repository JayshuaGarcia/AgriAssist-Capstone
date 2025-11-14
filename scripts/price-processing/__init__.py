"""Excel Price Manager package."""

from importlib.metadata import version, PackageNotFoundError


try:
    __version__ = version("price-manager")
except PackageNotFoundError:  # pragma: no cover - during local dev
    __version__ = "0.1.0"


__all__ = ["__version__"]

