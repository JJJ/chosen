async function runTabNavigationFixture(page, kind) {
  await page.evaluate((adapter) => {
    const wrapper = document.createElement('div');
    wrapper.id = 'tab-navigation-fixture';
    wrapper.innerHTML = '<input id="tab-before"><select id="tab-select"></select><input id="tab-after">';
    document.body.appendChild(wrapper);
    const select = wrapper.querySelector('select');
    select.add(new Option('Choose', ''));
    for (let index = 1; index <= 80; index += 1) select.add(new Option(`Option ${index}`, String(index)));
    if (adapter === 'jquery') window.jQuery(select).chosen();
    else new window.Chosen(select);
  }, kind);
  try {
    const control = page.locator('#tab-select + .chosen-container .chosen-single');
    await control.click();
    await page.keyboard.press('End');
    await page.waitForFunction(() => {
      const list = document.querySelector('#tab-select + .chosen-container .chosen-results');
      return list.scrollTop > 0 && list.querySelector('.highlighted')?.getAttribute('data-value') === '80';
    });
    const scrollTop = await page.locator('#tab-select + .chosen-container .chosen-results').evaluate((list) => list.scrollTop);
    await page.keyboard.press('Tab');
    await page.waitForFunction(() => document.querySelector('#tab-select + .chosen-container .chosen-single').getAttribute('aria-expanded') === 'false');
    const state = await page.evaluate(() => ({
      value: document.querySelector('#tab-select').value,
      focus: document.activeElement.id,
      expanded: document.querySelector('#tab-select + .chosen-container .chosen-single').getAttribute('aria-expanded'),
    }));
    await page.keyboard.press('Shift+Tab');
    const reverseFocus = await page.evaluate(() => document.activeElement.className);
    await control.click();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowDown');
    const homeValue = await page.evaluate(() => document.querySelector('#tab-select + .chosen-container .chosen-results .highlighted')?.getAttribute('data-value'));
    if (homeValue !== '1') throw new Error(`Home highlighted ${homeValue} instead of Option 1`);
    await page.keyboard.press('Shift+Tab');
    await page.waitForFunction(() => document.querySelector('#tab-select + .chosen-container .chosen-single').getAttribute('aria-expanded') === 'false');
    const reverseState = await page.evaluate(() => ({
      value: document.querySelector('#tab-select').value,
      focus: document.activeElement.id,
      expanded: document.querySelector('#tab-select + .chosen-container .chosen-single').getAttribute('aria-expanded'),
    }));
    return state.value === '80' && state.focus === 'tab-after' && state.expanded === 'false' &&
      reverseFocus.includes('chosen-single') && reverseState.value === '1' &&
      reverseState.focus === 'tab-before' && reverseState.expanded === 'false'
      ? [] : [`Keyboard: Tab or Shift+Tab did not select and move between fields (${JSON.stringify({ scrollTop, state, reverseFocus, reverseState })})`];
  } finally {
    await page.locator('#tab-navigation-fixture').evaluate((wrapper) => wrapper.remove());
  }
}

module.exports = { runTabNavigationFixture };
