from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pyppeteer.page import Page


async def _evaluate_vuetify(page: Page, expression: str):
    """Run the provided Vuetify element selector function."""
    from pyppeteer.errors import ElementHandleError

    # Try to execute the instruction
    try:
        return await page.evaluate(expression)
    # If it fails, load the Vuetify selector JS code into the current page context and try again
    except ElementHandleError:
        with open(Path(__file__).parent / 'js' / 'vuetify-xpaths.js', 'r') as fd:
            await page.evaluate(fd.read())
        return await page.evaluate(expression)


async def vBtn(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vBtn("{string}");'))


async def vCard(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vCard("{string}");'))


async def vChip(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vChip("{string}");'))


async def vIcon(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vIcon("{string}");'))


async def vImg(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vImg("{string}");'))


async def vList(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vList("{string}");'))


async def vListItem(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vListItem("{string}");'))


async def vListItemTitle(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vListItemTitle("{string}");'))


async def vListItemSubtitle(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vListItemSubtitle("{string}");'))


async def vListItemAction(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vListItemAction("{string}");'))


async def vListItemAvatar(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vListItemAvatar("{string}");'))


async def vListItemIcon(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vListItemIcon("{string}");'))


async def vListItemGroup(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vListItemGroup("{string}");'))


async def vListTile(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vListTile("{string}");'))


async def vTextarea(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vTextarea("{string}");'))


async def vTextField(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vTextField("{string}");'))


async def vToolbar(page: Page, string: str) -> str:
    return await (_evaluate_vuetify(page, f'vToolbar("{string}");'))
