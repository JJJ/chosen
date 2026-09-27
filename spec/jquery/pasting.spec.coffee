describe "Pasting multiple choices", ->
  make_control = (options = {}) ->
    div = $("<div><select multiple><option value='a'>Alpha</option><option value='b'>Beta</option><option value='c' disabled>Gamma</option><option value='d' hidden>Delta</option><optgroup label='Hidden' hidden><option value='e'>Echo</option></optgroup><option value='f'>Twin</option><option value='g'>Twin</option></select></div>").appendTo('body')
    chosen = div.find('select').chosen(options).data('chosen')
    {div, chosen}

  paste = (chosen, text) ->
    evt = $.Event('paste')
    evt.clipboardData = getData: -> text
    chosen.clipboard_event_checker(evt)
    evt

  it "keeps ordinary paste behavior by default", ->
    {div, chosen} = make_control()
    evt = paste(chosen, 'Alpha; b')
    expect(evt.isDefaultPrevented()).toBe(false)
    expect(div.find('select')[0].selectedOptions.length).toBe(0)
    div.remove()

  it "selects only unique, existing, enabled options and preserves unmatched text", ->
    {div, chosen} = make_control(paste_multiple_values: true)
    changed = 0
    div.find('select').on 'change', -> changed++
    chosen.results_show()
    evt = paste(chosen, 'Alpha; b, Gamma, Delta, Echo, Twin, Unknown')

    expect(evt.isDefaultPrevented()).toBe(true)
    expect(div.find('select').val()).toEqual(['a', 'b'])
    expect(chosen.search_field.val()).toBe('Gamma, Delta, Echo, Twin, Unknown')
    expect(changed).toBe(1)
    expect(div.find('.search-choice').length).toBe(2)
    div.remove()

  it "respects the selection limit and leaves remaining values to edit", ->
    {div, chosen} = make_control(paste_multiple_values: true, max_selected_options: 1)
    maxed = 0
    div.find('select').on 'chosen:maxselected', -> maxed++
    evt = paste(chosen, 'a,b')

    expect(evt.isDefaultPrevented()).toBe(true)
    expect(div.find('select').val()).toEqual(['a'])
    expect(chosen.search_field.val()).toBe('b')
    expect(maxed).toBe(1)
    div.remove()

  it "combines pasted text with an existing search prefix", ->
    {div, chosen} = make_control(paste_multiple_values: true)
    chosen.search_field.val('Al')
    chosen.search_field[0].setSelectionRange(2, 2)
    expect(paste(chosen, 'pha; Beta').isDefaultPrevented()).toBe(true)
    expect(div.find('select').val()).toEqual(['a', 'b'])
    div.remove()
