from typing import Sequence

from api.categories.schemas import Category
from src.models.models import Categories


def validate_categories_list(in_cats: Sequence[Categories]) -> list[Category]:
    res = []
    for el in in_cats:
        el =  Category.model_validate(el)
        res.append(el)
    return res

def validate_category(in_cat: Categories) -> Category:
    return Category.model_validate(in_cat)
