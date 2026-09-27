describe "Pasting multiple choices", ->
  make_control = (options = {}) ->
    div = new Element('div').update("<select multiple><option value='a'>Alpha</option><option value='b'>Beta</option><option value='c' disabled>Gamma</option><option value='d' hidden>Delta</option><optgroup label='Hidden' hidden><option value='e'>Echo</option></optgroup><option value='f'>Twin</option><option value='g'>Twin</option></select>")
    document.body.insert(div)
    select = div.down('select')
    chosen = new Chosen(select, options)
    {div, select, chosen}

  paste = (chosen, text) ->
    prevented = false
    evt =
      type: 'paste'
      clipboardData: getData: -> text
      preventDefault: -> prevented = true
    chosen.clipboard_event_checker(evt)
    prevented

  it "keeps ordinary paste behavior by default", ->
    {div, select, chosen} = make_control()
    expect(paste(chosen, 'Alpha; b')).toBe(false)
    expect(select.selectedOptions.length).toBe(0)
    div.remove()

  it "selects only unique, existing, enabled options and preserves unmatched text", ->
    {div, select, chosen} = make_control(paste_multiple_values: true)
    changed = 0
    select.observe 'change', -> changed++
    chosen.results_show()
    expect(paste(chosen, 'Alpha; b, Gamma, Delta, Echo, Twin, Unknown')).toBe(true)

    expect(Array.from(select.querySelectorAll('option:checked')).map((option) -> option.value)).toEqual(['a', 'b'])
    expect(chosen.search_field.value).toBe('Gamma, Delta, Echo, Twin, Unknown')
    expect(changed).toBe(1)
    expect(div.select('.search-choice').length).toBe(2)
    div.remove()

  it "respects the selection limit and leaves remaining values to edit", ->
    {div, select, chosen} = make_control(paste_multiple_values: true, max_selected_options: 1)
    maxed = 0
    select.observe 'chosen:maxselected', -> maxed++
    expect(paste(chosen, 'a,b')).toBe(true)

    expect(Array.from(select.querySelectorAll('option:checked')).map((option) -> option.value)).toEqual(['a'])
    expect(chosen.search_field.value).toBe('b')
    expect(maxed).toBe(1)
    div.remove()

  it "combines pasted text with an existing search prefix", ->
    {div, select, chosen} = make_control(paste_multiple_values: true)
    chosen.search_field.value = 'Al'
    chosen.search_field.setSelectionRange(2, 2)
    expect(paste(chosen, 'pha; Beta')).toBe(true)
    expect(Array.from(select.querySelectorAll('option:checked')).map((option) -> option.value)).toEqual(['a', 'b'])
    div.remove()
