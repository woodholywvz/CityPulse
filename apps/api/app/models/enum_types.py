from __future__ import annotations

from enum import Enum as PyEnum

from sqlalchemy import Enum


def enum_values_type[EnumType: PyEnum](enum_class: type[EnumType], *, name: str) -> Enum:
    return Enum(
        enum_class,
        name=name,
        native_enum=False,
        values_callable=lambda members: [member.value for member in members],
        validate_strings=True,
    )
