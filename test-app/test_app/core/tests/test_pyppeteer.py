from girder_pytest_pyppeteer.vuetify_xpaths import vBtn, vCard
import pytest


@pytest.fixture
async def logged_in_page(webpack_server, page, user, page_login):
    """
    Log the user into the page.

    This involves setting cookies as if the server has already approved the user, then clicking
    "Login" to trigger the OAuth flow.
    """
    await page_login(page, user)
    await page.goto(webpack_server)
    login_button = await page.waitForXPath(await vBtn(page, 'Login'))
    await login_button.click()
    return page


@pytest.mark.pyppeteer
async def test_login_hack(logged_in_page):
    """Test that logged_in_page is in fact logged in."""
    # Wait for elements that should only be present if login succeeded
    await logged_in_page.waitForXPath('//button[contains(., "Logout")]')
    await logged_in_page.waitForXPath('//a[contains(., "My Images")]')


@pytest.mark.pyppeteer
async def test_image_lists(logged_in_page, image_factory, user, user_factory):
    """Test that the image list pages contain the correct images."""
    my_image = image_factory(owner=user)
    other_user = user_factory()
    other_image = image_factory(owner=other_user)

    # The All Images tab should have both images
    all_images_tab = await logged_in_page.waitForXPath('//a[contains(., "All Images")]')
    await all_images_tab.click()
    await logged_in_page.waitForXPath(await vCard(logged_in_page, my_image.name))
    await logged_in_page.waitForXPath(await vCard(logged_in_page, user.username))
    await logged_in_page.waitForXPath(await vCard(logged_in_page, other_image.name))
    await logged_in_page.waitForXPath(await vCard(logged_in_page, other_user.username))

    # The My Images tab should only have my image
    my_images_tab = await logged_in_page.waitForXPath('//a[contains(., "My Images")]')
    await my_images_tab.click()
    await logged_in_page.waitForXPath(await vCard(logged_in_page, my_image.name))
    await logged_in_page.waitForXPath(await vCard(logged_in_page, user.username))
    # The other image should be absent
    assert (await logged_in_page.xpath(await vCard(logged_in_page, other_image.name))) == []
